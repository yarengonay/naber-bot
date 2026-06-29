import { useEffect, useRef, useState } from "react";
import StatusBar from "./components/StatusBar";
import ChatBubble from "./components/ChatBubble";
import TypingIndicator from "./components/TypingIndicator";
import ActionPanel from "./components/ActionPanel";
import { messages } from "./lib/messages";
import {
  checkFreighterInstalled,
  checkExistingPermission,
  connectWallet,
  fetchBalance,
  fundWithFriendbot,
  sendPayment,
  fetchRecentTransactions,
  BASE_FEE_XLM,
  balancesDiffer,
} from "./lib/stellar";
import "./App.css";

const TYPING_DELAY = 650;

export default function App() {
  const [chat, setChat] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState("disconnected"); // disconnected | connecting | connected
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [flow, setFlow] = useState("connect"); // connect | idle | payment-form | payment-confirm | busy | address-book
  const [paymentFormKey, setPaymentFormKey] = useState(0);
  const [pendingPayment, setPendingPayment] = useState(null); // {destination, amount}
  const [personality, setPersonality] = useState(() => {
    return localStorage.getItem("bot_personality") || "friendly";
  });
  const [contacts, setContacts] = useState([]);
  const scrollRef = useRef(null);
  const didInit = useRef(false);

  // Bot mesajını yazıyor animasyonuyla ekle
  function pushBot(messageObj) {
    return new Promise((resolve) => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setChat((prev) => [...prev, messageObj]);
        resolve();
      }, TYPING_DELAY);
    });
  }

  function pushUser(messageObj) {
    setChat((prev) => [...prev, messageObj]);
  }

  // İlk açılış: hoş geldin mesajı + Freighter kontrolü + önceki izin kontrolü
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    (async () => {
      await pushBot(messages.welcome(personality));

      const installed = await checkFreighterInstalled();
      if (!installed) {
        await pushBot(messages.freighterNotFound(personality));
        return;
      }

      const existingAddress = await checkExistingPermission();
      if (existingAddress) {
        await handleConnected(existingAddress);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mesaj geldiğinde otomatik aşağı kaydır
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat, isTyping]);

  // Adres defteri yükleme
  useEffect(() => {
    if (address) {
      const saved = localStorage.getItem(`contacts_${address}`);
      setContacts(saved ? JSON.parse(saved) : []);
    } else {
      setContacts([]);
    }
  }, [address]);

  async function handleConnected(addr) {
    setAddress(addr);
    setStatus("connected");
    setFlow("busy");
    await pushBot(messages.connected(addr, personality));
    await refreshBalance(addr, { announce: true });
    setFlow("idle");
  }

  async function handleConnect() {
    setFlow("busy");
    setStatus("connecting");
    pushUser(messages.userText("Cüzdanı bağla"));
    await pushBot(messages.connecting(personality));

    try {
      const result = await Promise.race([
        connectWallet(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), 30000)
        ),
      ]);
      await handleConnected(result.address);
    } catch (err) {
      setStatus("disconnected");
      setFlow("connect");
      if (err.message === "TIMEOUT") {
        await pushBot(
          messages.genericError(
            "Freighter penceresi açılmadı veya yanıt vermedi. Tarayıcı eklentiler menüsünden Freighter ikonuna tıklayıp açık mı kontrol eder misin?",
            personality
          )
        );
      } else if (err.message.startsWith("WRONG_NETWORK:")) {
        const network = err.message.split(":")[1] || "bilinmeyen";
        await pushBot(messages.wrongNetwork(network, personality));
      } else {
        await pushBot(messages.genericError(err.message, personality));
      }
    }
  }

  function handleDisconnect() {
    pushUser(messages.userText("Bağlantıyı kes"));
    if (address) {
      localStorage.removeItem(`optimistic_balance_${address}`);
    }
    setStatus("disconnected");
    setAddress(null);
    setBalance(null);
    setFlow("connect");
    pushBot(messages.disconnected(personality));
  }

  async function handlePersonalityChange(newP) {
    setPersonality(newP);
    localStorage.setItem("bot_personality", newP);
    await pushBot(messages.personalityChanged(newP));
  }

  async function handleShowTransactions() {
    setFlow("busy");
    pushUser(messages.userText("Son işlemlerimi göster"));
    await pushBot(messages.checkingBalance(personality));
    try {
      const records = await fetchRecentTransactions(address, 5);
      if (records.length === 0) {
        await pushBot(messages.systemNote("Kayıtlı son işlem bulunamadı.", "default"));
      } else {
        await pushBot(messages.txListHeader(personality));
        for (const record of records) {
          const isPayment = record.type === "payment";
          const amount = isPayment ? record.amount : record.starting_balance;
          const target = record.from === address ? record.to : record.from;
          const txType = record.from === address ? "Gönderim" : "Alım";
          const date = new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          const msgObj = messages.txListItem(txType, parseFloat(amount).toFixed(2), target, date, record.transaction_hash, personality);
          await pushBot(msgObj);
        }
      }
    } catch (err) {
      await pushBot(messages.genericError("İşlem geçmişi alınamadı: " + err.message, personality));
    } finally {
      setFlow("idle");
    }
  }

  function handleAddContact(name, addr) {
    if (!name.trim()) {
      pushBot(messages.systemNote("Lütfen kişi ismi giriniz.", "error"));
      return false;
    }
    if (!/^G[A-Z0-9]{55}$/.test(addr.trim())) {
      pushBot(messages.systemNote("Geçersiz Stellar adresi.", "error"));
      return false;
    }
    const updated = [...contacts, { name: name.trim(), address: addr.trim() }];
    setContacts(updated);
    localStorage.setItem(`contacts_${address}`, JSON.stringify(updated));
    pushBot(messages.systemNote(`'${name}' kişisi başarıyla kaydedildi.`, "success"));
    return true;
  }

  function handleDeleteContact(index) {
    const contact = contacts[index];
    const updated = contacts.filter((_, i) => i !== index);
    setContacts(updated);
    localStorage.setItem(`contacts_${address}`, JSON.stringify(updated));
    pushBot(messages.systemNote(`'${contact.name}' kişisi silindi.`, "success"));
  }

  async function refreshBalance(addr, { announce = false, notify, waitForChangeFrom } = {}) {
    const shouldNotify = notify ?? announce;
    if (announce) await pushBot(messages.checkingBalance(personality));
    try {
      let bal = await fetchBalance(addr, { waitForChangeFrom });
      if (bal === "0" && waitForChangeFrom === undefined) {
        await pushBot(messages.balanceZeroFunding(personality));
        try {
          await fundWithFriendbot(addr);
          await pushBot(messages.balanceFunded(personality));
          bal = await fetchBalance(addr);
        } catch {
          // Friendbot başarısız olursa sessizce devam et, bakiye 0 gösterilir
        }
      }
      const formatted = formatBalance(bal);
      let finalBalance = formatted;
      let isStale =
        waitForChangeFrom !== undefined && !balancesDiffer(bal, waitForChangeFrom);

      // İyimser (optimistic) bakiye önbelleği kontrolü
      const cached = localStorage.getItem(`optimistic_balance_${addr}`);
      if (cached) {
        const { balance: optBal, expiresAt } = JSON.parse(cached);
        if (Date.now() < expiresAt) {
          // Horizon henüz güncellenmemişse çekilen bakiye iyimser bakiyeden büyük kalacaktır
          if (parseFloat(formatted) > parseFloat(optBal)) {
            finalBalance = optBal;
            isStale = true;
          } else {
            // Horizon güncellenmişse önbelleği temizle
            localStorage.removeItem(`optimistic_balance_${addr}`);
          }
        } else {
          // Süresi geçmiş önbellek
          localStorage.removeItem(`optimistic_balance_${addr}`);
        }
      }

      setBalance(finalBalance);

      if (shouldNotify) {
        if (isStale) {
          await pushBot(messages.balanceSyncPending(personality));
        } else {
          await pushBot(messages.balanceResult(finalBalance, personality));
        }
      }
    } catch {
      if (shouldNotify) await pushBot(messages.balanceError(personality));
    }
  }

  function formatBalance(bal) {
    const num = parseFloat(bal);
    return Number.isFinite(num) ? num.toFixed(2) : bal;
  }

  async function handleCheckBalance() {
    setFlow("busy");
    pushUser(messages.userText("Bakiyemi göster"));
    await refreshBalance(address, { announce: true });
    setFlow("idle");
  }

  async function handleStartPayment() {
    pushUser(messages.userText("XLM göndermek istiyorum"));
    await pushBot(messages.askPaymentDetails(personality));
    setPaymentFormKey((k) => k + 1);
    setFlow("payment-form");
  }

  function handleCancelPayment() {
    pushUser(messages.userText("Vazgeç"));
    setPendingPayment(null);
    setFlow("idle");
  }

  async function handleSubmitPaymentForm({ destination, amount }) {
    pushUser(
      messages.userText(`${amount} XLM → ${destination.slice(0, 6)}...${destination.slice(-4)}`)
    );

    // Basit validasyon
    const isValidAddress = /^G[A-Z0-9]{55}$/.test(destination);
    if (!isValidAddress) {
      await pushBot(messages.invalidAddress(personality));
      return; // formda kalsın
    }

    const numAmount = parseFloat(amount.replace(",", "."));
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      await pushBot(messages.invalidAmount(personality));
      return;
    }

    if (balance !== null && numAmount > parseFloat(balance)) {
      await pushBot(messages.insufficientBalance(balance, personality));
      return;
    }

    setPendingPayment({ destination, amount: numAmount });
    setFlow("busy");
    await pushBot(messages.confirmPayment(numAmount, destination, personality));
    setFlow("payment-confirm");
  }

  async function handleConfirmPayment() {
    if (!pendingPayment) return;
    setFlow("busy");
    pushUser(messages.userText("Onaylıyorum"));
    await pushBot(messages.sendingPayment(personality));

    try {
      const result = await sendPayment({
        sourcePublicKey: address,
        destination: pendingPayment.destination,
        amount: pendingPayment.amount,
      });

      await pushBot(messages.submittingPayment(personality));

      if (result.successful) {
        const balanceBeforePayment = balance;
        let formattedOptimistic = null;
        if (balanceBeforePayment !== null) {
          const optimistic =
            parseFloat(balanceBeforePayment) - pendingPayment.amount - BASE_FEE_XLM;
          formattedOptimistic = formatBalance(String(Math.max(0, optimistic)));
          setBalance(formattedOptimistic);

          // İyimser bakiyeyi localStorage'a kaydet (30 saniye geçerli)
          localStorage.setItem(
            `optimistic_balance_${address}`,
            JSON.stringify({
              balance: formattedOptimistic,
              expiresAt: Date.now() + 30000,
            })
          );
        }

        await pushBot(
          messages.paymentSuccess(pendingPayment.amount, result.hash, result.ledger, personality)
        );

        await refreshBalance(address, {
          notify: true,
          waitForChangeFrom: balanceBeforePayment,
        });
      } else {
        await pushBot(messages.paymentFailed(null, personality));
      }
    } catch (err) {
      const errMsg = err?.message || "";
      if (/declined|rejected|user/i.test(errMsg)) {
        await pushBot(messages.paymentRejected(personality));
      } else {
        await pushBot(messages.paymentFailed(errMsg, personality));
      }
    } finally {
      setPendingPayment(null);
      setFlow("idle");
    }
  }

  return (
    <div className="app-shell">
      <StatusBar
        status={status}
        address={address}
        balance={balance}
        onDisconnect={handleDisconnect}
        personality={personality}
        onChangePersonality={handlePersonalityChange}
      />

      <main className="chat-window" ref={scrollRef}>
        <div className="chat-window__inner">
          {chat.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
      </main>

      <ActionPanel
        key={flow === "payment-form" ? `payment-form-${paymentFormKey}` : flow}
        flow={flow}
        disabled={flow === "busy"}
        contacts={contacts}
        onConnect={handleConnect}
        onCheckBalance={handleCheckBalance}
        onStartPayment={handleStartPayment}
        onSubmitPaymentForm={handleSubmitPaymentForm}
        onConfirmPayment={handleConfirmPayment}
        onCancelPayment={handleCancelPayment}
        onAddContact={handleAddContact}
        onDeleteContact={handleDeleteContact}
        onShowTransactions={handleShowTransactions}
        onOpenAddressBook={() => setFlow("address-book")}
        onCloseAddressBook={() => setFlow("idle")}
      />
    </div>
  );
}
