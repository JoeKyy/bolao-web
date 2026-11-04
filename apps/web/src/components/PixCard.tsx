"use client";
import type { PixCobranca } from "@bolao/shared";
import { formatBRL } from "@bolao/shared";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { BotaoCopiar } from "./ui";

export function PixCard({ pix }: { pix: PixCobranca }) {
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    QRCode.toDataURL(pix.copiaECola, { margin: 1, width: 240, errorCorrectionLevel: "M" })
      .then(setQr)
      .catch(() => setQr(null));
  }, [pix.copiaECola]);
  return (
    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm text-amber-900">
        Pague <strong>{formatBRL(pix.valor)}</strong> por Pix. O código já vai com o valor e o identificador{" "}
        <strong className="font-mono">{pix.identificador}</strong>, que ajuda o organizador a achar o seu pagamento.
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        {qr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="QR Code do Pix" width={160} height={160} className="rounded-lg border border-amber-200 bg-white" />
        )}
        <div className="w-full min-w-0 space-y-2">
          <p className="label !text-amber-900">Pix copia e cola</p>
          <p className="break-all rounded-lg bg-white p-2 font-mono text-xs">{pix.copiaECola}</p>
          <BotaoCopiar texto={pix.copiaECola} rotulo="Copiar código Pix" />
        </div>
      </div>
      <p className="text-xs text-amber-900/80">Depois de pagar, o organizador confirma aqui. Não há confirmação automática.</p>
    </div>
  );
}
