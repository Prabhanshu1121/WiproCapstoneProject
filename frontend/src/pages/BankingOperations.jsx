import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { getError } from "../api/client";
import FormStatus from "../components/FormStatus";
import { bankingApi } from "../services/api";

export default function BankingOperations() {
  const [deposit, setDeposit] = useState({ amount: "" });
  const [withdraw, setWithdraw] = useState({ amount: "" });
  const [transfer, setTransfer] = useState({ receiverAccount: "", amount: "" });
  const [qrForm, setQrForm] = useState({ qrCode: "", amount: "" });
  const [myQr, setMyQr] = useState(null);
  const [qrImage, setQrImage] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [status, setStatus] = useState({});
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);

  useEffect(() => {
    bankingApi.myQr()
      .then(({ data }) => setMyQr(data))
      .catch((err) => setStatus({ error: getError(err) }));
  }, []);

  useEffect(() => {
    if (!myQr?.qrCode) return;
    QRCode.toDataURL(qrPayload(myQr.qrCode), { width: 280, margin: 2, color: { dark: "#102421", light: "#ffffff" } })
      .then(setQrImage)
      .catch(() => setStatus({ error: "Unable to create QR image" }));
  }, [myQr]);

  useEffect(() => () => stopCamera(), []);

  const submitDeposit = async (e) => {
    e.preventDefault();
    await run(async () => {
      await bankingApi.deposit({ amount: deposit.amount });
      setDeposit({ amount: "" });
    }, "Deposit completed");
  };

  const submitWithdraw = async (e) => {
    e.preventDefault();
    await run(async () => {
      await bankingApi.withdraw({ amount: withdraw.amount });
      setWithdraw({ amount: "" });
    }, "Withdrawal completed");
  };

  const submitTransfer = async (e) => {
    e.preventDefault();
    await run(async () => {
      await bankingApi.transfer({ receiverAccount: transfer.receiverAccount.trim(), amount: transfer.amount });
      setTransfer({ receiverAccount: "", amount: "" });
    }, "Transfer completed");
  };

  const submitQrPayment = async (e) => {
    e.preventDefault();
    await run(async () => {
      await bankingApi.qrPayment({ qrCode: qrForm.qrCode.trim(), amount: qrForm.amount });
      setQrForm({ qrCode: "", amount: "" });
    }, "QR payment completed");
  };

  const run = async (action, message) => {
    setStatus({});
    try {
      await action();
      setStatus({ success: message });
    } catch (err) {
      setStatus({ error: getError(err) });
    }
  };

  const applyScannedQr = (rawValue) => {
    const scannedCode = parseQrPayload(rawValue);
    if (!scannedCode) {
      setStatus({ error: "This QR image is not a SmartBank payment QR" });
      return;
    }
    setQrForm((current) => ({ ...current, qrCode: scannedCode }));
    setStatus({ success: "Receiver QR scanned. Enter amount and pay." });
    stopCamera();
  };

  const scanImage = async (file) => {
    if (!file) return;
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height);
      if (result?.data) applyScannedQr(result.data);
      else setStatus({ error: "No QR code found in selected image" });
      URL.revokeObjectURL(image.src);
    };
    image.onerror = () => setStatus({ error: "Unable to read selected image" });
    image.src = URL.createObjectURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCameraOn(true);
      window.setTimeout(async () => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }, 0);
      scanTimerRef.current = window.setInterval(scanCameraFrame, 600);
    } catch {
      setStatus({ error: "Camera permission denied or camera not available" });
    }
  };

  const stopCamera = () => {
    if (scanTimerRef.current) window.clearInterval(scanTimerRef.current);
    scanTimerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const scanCameraFrame = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(imageData.data, imageData.width, imageData.height);
    if (result?.data) applyScannedQr(result.data);
  };

  const downloadQr = () => {
    if (!qrImage) return;
    const link = document.createElement("a");
    link.href = qrImage;
    link.download = `${myQr?.accountHolder || "smartbank"}-qr.png`.replace(/[^a-z0-9.-]+/gi, "-");
    link.click();
  };

  return <div className="banking-ops-page">
    <section className="ops-hero">
      <div>
        <span className="section-kicker">Banking Operations</span>
        <h2>Move money from one clean workspace</h2>
        <p>Deposit, withdraw, transfer, scan receiver QR, and download your own account QR without jumping between pages.</p>
      </div>
      <div className="ops-hero-metric">
        <span>Payment modes</span>
        <strong>4</strong>
      </div>
    </section>

    <FormStatus {...status} />

    <section className="ops-grid">
      <OperationCard icon="DP" title="Deposit" subtitle="Add funds to your savings account.">
        <form onSubmit={submitDeposit} className="ops-form">
          <label>Amount<input type="number" min="1" value={deposit.amount} onChange={(e) => setDeposit({ amount: e.target.value })} placeholder="1500" required /></label>
          <button>Submit Deposit</button>
        </form>
      </OperationCard>

      <OperationCard icon="WD" title="Withdraw" subtitle="Withdraw available balance instantly.">
        <form onSubmit={submitWithdraw} className="ops-form">
          <label>Amount<input type="number" min="1" value={withdraw.amount} onChange={(e) => setWithdraw({ amount: e.target.value })} placeholder="500" required /></label>
          <button>Submit Withdraw</button>
        </form>
      </OperationCard>

      <OperationCard icon="TR" title="Transfer" subtitle="Send money using receiver account number.">
        <form onSubmit={submitTransfer} className="ops-form">
          <label>Receiver Account<input value={transfer.receiverAccount} onChange={(e) => setTransfer({ ...transfer, receiverAccount: e.target.value })} placeholder="SB..." required /></label>
          <label>Amount<input type="number" min="1" value={transfer.amount} onChange={(e) => setTransfer({ ...transfer, amount: e.target.value })} placeholder="1000" required /></label>
          <button>Submit Transfer</button>
        </form>
      </OperationCard>

      <OperationCard icon="QR" title="QR Payment" subtitle="Scan a SmartBank QR from gallery or camera.">
        <form onSubmit={submitQrPayment} className="ops-form">
          <div className="ops-qr-row">
            <div>
              <span className="ops-label">Your Account QR</span>
              {qrImage ? <img className="ops-qr-image" src={qrImage} alt="Your SmartBank account QR" /> : <div className="ops-qr-loading">Loading QR</div>}
              <button type="button" className="secondary-action" onClick={downloadQr} disabled={!qrImage}>Download QR</button>
            </div>
            <div className="qr-scan-panel">
              <label>Receiver QR From Gallery<input type="file" accept="image/*" onChange={(e) => scanImage(e.target.files?.[0])} /></label>
              <div className="qr-actions">
                <button type="button" onClick={cameraOn ? stopCamera : startCamera}>{cameraOn ? "Stop Camera" : "Scan With Camera"}</button>
                <span className={qrForm.qrCode ? "scan-state ready" : "scan-state"}>{qrForm.qrCode ? "Receiver QR ready" : "No receiver QR scanned"}</span>
              </div>
              {cameraOn && <video ref={videoRef} className="qr-camera" playsInline muted />}
            </div>
          </div>
          <label>Amount<input type="number" min="1" value={qrForm.amount} onChange={(e) => setQrForm({ ...qrForm, amount: e.target.value })} placeholder="999" required /></label>
          <button disabled={!qrForm.qrCode}>Pay With QR</button>
        </form>
      </OperationCard>
    </section>
  </div>;
}

function OperationCard({ icon, title, subtitle, children }) {
  return <section className="ops-card">
    <div className="ops-card-head">
      <span>{icon}</span>
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
    </div>
    {children}
  </section>;
}

function qrPayload(qrCode) {
  return `SMARTBANK_PAY:${qrCode}`;
}

function parseQrPayload(value) {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.startsWith("SMARTBANK_PAY:")) return trimmed.replace("SMARTBANK_PAY:", "").trim();
  if (trimmed.startsWith("SBQR-")) return trimmed;
  return "";
}
