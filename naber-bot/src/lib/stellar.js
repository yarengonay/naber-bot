import {
  isConnected,
  isAllowed,
  setAllowed,
  requestAccess,
  getAddress,
  getNetwork,
  signTransaction,
} from "@stellar/freighter-api";
import {
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  BASE_FEE,
} from "@stellar/stellar-sdk";

// Stellar Testnet ayarları
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;
const FRIENDBOT_URL = "https://friendbot.stellar.org";

const server = new Horizon.Server(HORIZON_URL);

/**
 * Freighter tarayıcı eklentisi kurulu mu kontrol eder.
 */
export async function checkFreighterInstalled() {
  try {
    const result = await isConnected();
    // result.isConnected: eklenti kurulu mu (bağlı olmasa da true döner)
    return !result.error && result.isConnected !== undefined;
  } catch {
    return false;
  }
}

/**
 * Kullanıcıdan cüzdan erişim izni ister ve adresi döner.
 */
export async function connectWallet() {
  // Önce siteye izin ver (Freighter popup'ını tetikler)
  const allowedResult = await setAllowed();
  if (allowedResult.error) {
    throw new Error(allowedResult.error);
  }

  const accessObj = await requestAccess();
  if (accessObj.error) {
    throw new Error(accessObj.error);
  }

  const networkObj = await getNetwork();
  if (networkObj.error) {
    throw new Error(networkObj.error);
  }
  if (networkObj.network !== "TESTNET") {
    throw new Error(`WRONG_NETWORK:${networkObj.network}`);
  }

  return {
    address: accessObj.address,
    network: networkObj.network, // "TESTNET" | "PUBLIC" | ...
    networkPassphrase: networkObj.networkPassphrase,
  };
}

/**
 * Site için verilmiş izni kontrol eder (otomatik yeniden bağlanma için).
 */
export async function checkExistingPermission() {
  const allowedObj = await isAllowed();
  if (allowedObj.error || !allowedObj.isAllowed) return null;

  const addressObj = await getAddress();
  if (addressObj.error) return null;

  const networkObj = await getNetwork();
  if (networkObj.error || networkObj.network !== "TESTNET") return null;

  return addressObj.address;
}

const BASE_FEE_XLM = Number(BASE_FEE) / 1e7;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function balancesDiffer(a, b) {
  return Math.abs(parseFloat(a) - parseFloat(b)) > 0.0000001;
}

/**
 * Verilen adresin XLM bakiyesini Horizon üzerinden sorgular.
 * Hesap testnette hiç fonlanmamışsa (404) "0" döner.
 *
 * waitForChangeFrom: ödeme sonrası Horizon index gecikmesi için önceki bakiyeden
 * farklı bir değer dönene kadar tekrar dener.
 */
export async function fetchBalance(publicKey, { waitForChangeFrom, maxAttempts = 12, retryDelayMs = 1500 } = {}) {
  const readOnce = async () => {
    try {
      const account = await server.loadAccount(publicKey);
      const xlmBalance = account.balances.find(
        (b) => b.asset_type === "native"
      );
      return xlmBalance ? xlmBalance.balance : "0";
    } catch (err) {
      if (err?.response?.status === 404) {
        return "0";
      }
      throw err;
    }
  };

  if (waitForChangeFrom === undefined) {
    return readOnce();
  }

  let latest = await readOnce();
  for (let attempt = 0; attempt < maxAttempts && !balancesDiffer(latest, waitForChangeFrom); attempt += 1) {
    await sleep(retryDelayMs);
    latest = await readOnce();
  }
  return latest;
}

/**
 * Testnette hesabı Friendbot ile fonlar (hesap yoksa gerekli).
 */
export async function fundWithFriendbot(publicKey) {
  const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`);
  if (!res.ok) {
    throw new Error("Friendbot fonlama isteği başarısız oldu.");
  }
  return res.json();
}

/**
 * XLM transferi için işlem oluşturur, Freighter ile imzalatır ve ağa gönderir.
 */
export async function sendPayment({ sourcePublicKey, destination, amount }) {
  // 1. Alıcı adresi geçerli mi (basit format kontrolü Stellar SDK ile)
  let destinationAccountExists = true;
  try {
    await server.loadAccount(destination);
  } catch (err) {
    if (err?.response?.status === 404) {
      destinationAccountExists = false;
    } else {
      throw err;
    }
  }

  // 2. Gönderenin hesabını yükle (sequence number için)
  const sourceAccount = await server.loadAccount(sourcePublicKey);

  // 3. İşlemi oluştur
  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      destinationAccountExists
        ? Operation.payment({
            destination,
            asset: Asset.native(),
            amount: String(amount),
          })
        : // Hesap testnette yoksa createAccount ile hem oluştur hem fonla
          Operation.createAccount({
            destination,
            startingBalance: String(amount),
          })
    )
    .setTimeout(60)
    .build();

  // 4. Freighter ile imzala
  const signedResult = await signTransaction(transaction.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  if (signedResult.error) {
    throw new Error(signedResult.error);
  }

  // 5. İmzalı işlemi ağa gönder
  const tx = TransactionBuilder.fromXDR(
    signedResult.signedTxXdr,
    NETWORK_PASSPHRASE
  );
  const submitResult = await server.submitTransaction(tx);

  return {
    hash: submitResult.hash,
    ledger: submitResult.ledger,
    successful: submitResult.successful,
  };
}

/**
 * Bağlı hesabın son işlemlerini getirir (en yeni N adet).
 */
export async function fetchRecentTransactions(publicKey, limit = 5) {
  const page = await server
    .payments()
    .forAccount(publicKey)
    .order("desc")
    .limit(limit)
    .call();
  return page.records;
}

export { NETWORK_PASSPHRASE, BASE_FEE_XLM, balancesDiffer };
