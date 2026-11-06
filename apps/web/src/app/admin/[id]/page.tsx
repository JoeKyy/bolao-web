"use client";
import type { ConcursoCaixa, EventoDTO, JogoAdminDTO, ParticipanteAdminDTO, ResumoAdmin } from "@bolao/shared";
import { formatBRL, parseDezenas, parseReais } from "@bolao/shared";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SeletorDezenas } from "@/components/SeletorDezenas";
import { Toast, NaoEncontrado, BotaoCopiar, Carregando, CarregandoPagina, Dezenas, ErroDeCarga, Numero, Secao, SeloSituacao } from "@/components/ui";
import { API_URL, api, comConfirmacao, mensagemDe } from "@/lib/api";
import { formatarDataHora, umEm } from "@/lib/datas";
import { useRecurso } from "@/lib/useRecurso";
import { Casca } from "@/components/Casca";

const FAIXA = { sena: "Sena", quina: "Quina", quadra: "Quadra" } as const;
type Avisar = (a: { erro?: string; ok?: string }) => void;

const reaisTxt = (c: number | null | undefined) => (c ? (c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "");
/** ISO -> valor de <input type="datetime-local"> no horário de Brasília. */
function paraLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() - 3 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}
const deLocal = (v: string) => (v ? new Date(`${v}:00-03:00`).toISOString() : null);

function Participante({
  p,
  jogos,
  preco,
  base,
  avisar,
  recarregar,
}: {
  p: ParticipanteAdminDTO;
  jogos: JogoAdminDTO[];
  preco: number;
  base: string;
  avisar: Avisar;
  recarregar: () => Promise<void>;
}) {
  const [nome, setNome] = useState(p.nome);
  const [whatsapp, setWhatsapp] = useState(p.whatsapp);
  const [valorTxt, setValorTxt] = useState("");
  const faz = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      avisar({ ok });
      await recarregar();
    } catch (e) {
      avisar({ erro: mensagemDe(e) });
    }
  };
  const pagar = (valor?: number) =>
    comConfirmacao((q) => api.post(`${base}/participantes/${p.id}/pagamento${q}`, valor === undefined ? {} : { valor }));
  const falta = p.devido - p.pago;

  return (
    <details className="rounded-xl border border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3">
        <span className="min-w-0">
          <span className="block truncate font-medium">{p.nome}</span>
          <span className="text-xs text-muted">
            {jogos.length} jogo(s) · deve {formatBRL(p.devido)} · pago {formatBRL(p.pago)}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {p.parte !== null && p.parte > 0 && <span className="text-sm font-semibold text-brand-dark">{formatBRL(p.parte)}</span>}
          <SeloSituacao situacao={p.situacao} />
        </span>
      </summary>
      <div className="space-y-4 border-t border-line p-3">
        <div className="flex flex-wrap gap-2">
          {falta > 0 && (
            <button type="button" className="btn" onClick={() => faz(() => pagar(), `Pagamento de ${p.nome} confirmado.`)}>
              Confirmar {formatBRL(falta)} recebido
            </button>
          )}
          {p.pago > 0 && (
            <button type="button" className="btn-ghost" onClick={() => faz(() => pagar(0), `Pagamento de ${p.nome} desfeito.`)}>
              Marcar como não pago
            </button>
          )}
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const v = parseReais(valorTxt);
              if (v === null) return avisar({ erro: "Valor inválido." });
              void faz(() => pagar(v), "Valor recebido atualizado.");
              setValorTxt("");
            }}
          >
            <input aria-label="Outro valor recebido (R$)" placeholder="Outro valor (R$)" inputMode="decimal" className="input !w-36" value={valorTxt} onChange={(e) => setValorTxt(e.target.value)} />
            <button className="btn-ghost" type="submit">
              Gravar
            </button>
          </form>
        </div>

        {p.whatsapp && (
          <a className="text-sm font-semibold text-brand underline" href={`https://wa.me/${p.whatsapp.replace(/\D/g, "").replace(/^(?!55)/, "55")}`} target="_blank" rel="noopener noreferrer">
            Abrir WhatsApp de {p.nome.split(" ")[0]}
          </a>
        )}

        <ul className="space-y-2">
          {jogos.map((j) => (
            <li key={j.id} className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Dezenas dezenas={j.dezenas} acertos={j.conferencia?.acertadas} tamanho="sm" />
                <p className="text-xs text-muted">
                  {formatBRL(j.preco)}
                  {j.surpresinha ? " · surpresinha" : ""}
                  {j.registrado ? ` · registrado${j.comprovante ? ` (${j.comprovante})` : ""}` : " · a registrar"}
                </p>
              </div>
              {!j.registrado && (
                <button type="button" className="text-xs font-semibold text-danger-fg" onClick={() => window.confirm("Remover este jogo?") && faz(() => comConfirmacao((q) => api.del(`${base}/jogos/${j.id}${q}`)), "Jogo removido.")}>
                  Remover
                </button>
              )}
            </li>
          ))}
        </ul>

        <details>
          <summary className="cursor-pointer text-sm font-semibold text-brand">Incluir jogo para {p.nome.split(" ")[0]}</summary>
          <div className="pt-3">
            <SeletorDezenasAdmin participanteId={p.id} preco={preco} base={base} avisar={avisar} recarregar={recarregar} />
          </div>
        </details>

        <form
          className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            void faz(() => api.patch(`${base}/participantes/${p.id}`, { nome, whatsapp }), "Dados atualizados.");
          }}
        >
          <input aria-label="Nome" className="input" value={nome} minLength={2} maxLength={60} onChange={(e) => setNome(e.target.value)} />
          <input aria-label="WhatsApp" className="input" value={whatsapp} maxLength={30} placeholder="WhatsApp" onChange={(e) => setWhatsapp(e.target.value)} />
          <button className="btn-ghost" type="submit">
            Salvar dados
          </button>
        </form>
        <button
          type="button"
          className="btn-danger"
          onClick={() => window.confirm(`Remover ${p.nome} e os jogos dele do bolão?`) && faz(() => comConfirmacao((q) => api.del(`${base}/participantes/${p.id}${q}`)), "Participante removido.")}
        >
          Remover participante
        </button>
      </div>
    </details>
  );
}

function SeletorDezenasAdmin({
  participanteId,
  preco,
  base,
  avisar,
  recarregar,
}: {
  participanteId: number;
  preco: number;
  base: string;
  avisar: Avisar;
  recarregar: () => Promise<void>;
}) {
  const [lista, setLista] = useState("");
  async function enviar(jogos: number[][], surpresinha = false) {
    try {
      const feito = await comConfirmacao((q) => api.post(`${base}/jogos${q}`, { participanteId, jogos, surpresinha }).then(() => true));
      if (!feito) return false;
      avisar({ ok: `${jogos.length} jogo(s) incluído(s).` });
      await recarregar();
      return true;
    } catch (e) {
      avisar({ erro: mensagemDe(e) });
      return false;
    }
  }
  return (
    <div className="space-y-3">
      <SeletorDezenas maxDezenas={20} precoSimples={preco} onConfirmar={(d, s) => enviar([d], s)} />
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const linhas = lista.split("\n").map((l) => l.trim()).filter(Boolean);
          const jogos: number[][] = [];
          for (let i = 0; i < linhas.length; i++) {
            const r = parseDezenas(linhas[i]);
            if (!r.ok) return avisar({ erro: `Linha ${i + 1}: ${r.erro}` });
            jogos.push(r.dezenas);
          }
          if (jogos.length) void enviar(jogos).then((ok) => ok && setLista(""));
        }}
      >
        <label className="label" htmlFor={`lista-${participanteId}`}>
          Ou cole vários jogos (um por linha)
        </label>
        <textarea id={`lista-${participanteId}`} rows={3} className="input font-mono" placeholder={"04 11 23 35 48 57\n02 09 17 28 41 60"} value={lista} onChange={(e) => setLista(e.target.value)} />
        <button className="btn-ghost" type="submit">
          Incluir lista
        </button>
      </form>
    </div>
  );
}

function Resultado({ r, base, avisar, recarregar }: { r: ResumoAdmin; base: string; avisar: Avisar; recarregar: () => Promise<void> }) {
  const b = r.bolao;
  const [concurso, setConcurso] = useState(b.concurso ? String(b.concurso) : "");
  const [dezenas, setDezenas] = useState("");
  const [sena, setSena] = useState("");
  const [quina, setQuina] = useState("");
  const [quadra, setQuadra] = useState("");
  const [buscando, setBuscando] = useState(false);

  async function buscar() {
    setBuscando(true);
    try {
      const c = await comConfirmacao((q) => api.post<ConcursoCaixa>(`${base}/resultado/caixa${q}`, concurso ? { concurso: Number(concurso) } : {}));
      if (!c) return;
      avisar({ ok: `Resultado do concurso ${c.numero} (${c.data}) importado da Caixa.` });
      await recarregar();
    } catch (e) {
      avisar({ erro: mensagemDe(e) });
    } finally {
      setBuscando(false);
    }
  }
  async function manual(e: FormEvent) {
    e.preventDefault();
    const d = parseDezenas(dezenas, { min: 6, max: 6 });
    if (!d.ok) return avisar({ erro: d.erro });
    const premios = { sena: parseReais(sena || "0"), quina: parseReais(quina || "0"), quadra: parseReais(quadra || "0") };
    if (premios.sena === null || premios.quina === null || premios.quadra === null) return avisar({ erro: "Valor de prêmio inválido." });
    try {
      const feito = await comConfirmacao((q) => api.post(`${base}/resultado${q}`, { dezenas: d.dezenas, premios }).then(() => true));
      if (!feito) return;
      avisar({ ok: "Resultado registrado e inscrições encerradas." });
      await recarregar();
    } catch (err) {
      avisar({ erro: mensagemDe(err) });
    }
  }

  if (b.resultado) {
    return (
      <Secao titulo="Resultado e rateio" id="resultado">
        <Dezenas dezenas={b.resultado.dezenas} />
        <p className="text-sm">
          {r.totais.melhorFaixa ? (
            <>
              Melhor resultado: <strong>{FAIXA[r.totais.melhorFaixa]}</strong>. Prêmio do bolão: <strong>{formatBRL(r.totais.premioBolao ?? 0)}</strong>.
            </>
          ) : (
            "Nenhum jogo registrado premiou."
          )}
        </p>
        <p className="text-xs text-muted">
          Fonte: {b.resultado.fonte === "caixa" ? "API da Caixa" : "digitado"} em {formatarDataHora(b.resultado.registradoEm)}. Valores por aposta: sena {formatBRL(b.resultado.premios.sena)},
          quina {formatBRL(b.resultado.premios.quina)}, quadra {formatBRL(b.resultado.premios.quadra)}. Só jogos registrados entram na conferência; o rateio é proporcional ao valor pago.
        </p>
        <button
          type="button"
          className="btn-ghost"
          onClick={async () => {
            if (!window.confirm("Remover o resultado? O rateio some até registrar de novo.")) return;
            try {
              await comConfirmacao((q) => api.del(`${base}/resultado${q}`));
              await recarregar();
            } catch (e) {
              avisar({ erro: mensagemDe(e) });
            }
          }}
        >
          Corrigir resultado
        </button>
      </Secao>
    );
  }
  return (
    <Secao titulo="Resultado" id="resultado">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="concurso-busca" className="label">
            Concurso
          </label>
          <input id="concurso-busca" inputMode="numeric" className="input !w-32" value={concurso} onChange={(e) => setConcurso(e.target.value.replace(/\D/g, ""))} />
        </div>
        <button type="button" className="btn" onClick={buscar} disabled={buscando} aria-busy={buscando}>
          {buscando ? "Buscando…" : "Buscar resultado na Caixa"}
        </button>
      </div>
      <p className="text-xs text-muted">Importa as dezenas e o valor de cada faixa direto da Caixa. Se a consulta falhar, preencha à mão:</p>
      <form onSubmit={manual} className="grid gap-2 sm:grid-cols-2">
        <input aria-label="Dezenas sorteadas" placeholder="Dezenas sorteadas (6)" className="input sm:col-span-2" value={dezenas} onChange={(e) => setDezenas(e.target.value)} />
        <input aria-label="Prêmio por aposta da sena (R$)" placeholder="Sena por aposta (R$)" inputMode="decimal" className="input" value={sena} onChange={(e) => setSena(e.target.value)} />
        <input aria-label="Prêmio por aposta da quina (R$)" placeholder="Quina por aposta (R$)" inputMode="decimal" className="input" value={quina} onChange={(e) => setQuina(e.target.value)} />
        <input aria-label="Prêmio por aposta da quadra (R$)" placeholder="Quadra por aposta (R$)" inputMode="decimal" className="input" value={quadra} onChange={(e) => setQuadra(e.target.value)} />
        <button type="submit" className="btn-ghost">
          Registrar à mão
        </button>
      </form>
    </Secao>
  );
}

function Configuracoes({ r, base, avisar, recarregar }: { r: ResumoAdmin; base: string; avisar: Avisar; recarregar: () => Promise<void> }) {
  const b = r.bolao;
  const [f, setF] = useState({
    nome: b.nome,
    concurso: b.concurso ? String(b.concurso) : "",
    dataSorteio: paraLocal(b.dataSorteio),
    preco: reaisTxt(b.precoSimples),
    maxDezenas: String(b.maxDezenasParticipante),
    maxParticipantes: String(b.maxParticipantes),
    instrucoes: b.instrucoes,
    pixChave: b.pix?.chave ?? "",
    pixNome: b.pix?.nome ?? "",
    pixCidade: b.pix?.cidade ?? "",
    estimativa: reaisTxt(b.estimativaPremio),
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  async function salvar(e: FormEvent) {
    e.preventDefault();
    const preco = parseReais(f.preco);
    const estimativa = f.estimativa ? parseReais(f.estimativa) : null;
    if (!preco) return avisar({ erro: "Preço da aposta inválido." });
    try {
      await comConfirmacao((q) => api.patch(`${base}${q}`, {
        nome: f.nome,
        concurso: f.concurso ? Number(f.concurso) : null,
        dataSorteio: deLocal(f.dataSorteio),
        precoSimples: preco,
        maxDezenasParticipante: Number(f.maxDezenas),
        maxParticipantes: Number(f.maxParticipantes),
        instrucoes: f.instrucoes,
        pixChave: f.pixChave || null,
        pixNome: f.pixNome || null,
        pixCidade: f.pixCidade || null,
        estimativaPremio: estimativa,
      }));
      avisar({ ok: "Configurações salvas." });
      await recarregar();
    } catch (err) {
      avisar({ erro: mensagemDe(err) });
    }
  }
  const campo = (id: keyof typeof f, rotulo: string, extra: Record<string, unknown> = {}) => (
    <div>
      <label htmlFor={`cfg-${id}`} className="label">
        {rotulo}
      </label>
      <input id={`cfg-${id}`} className="input" value={f[id]} onChange={set(id)} {...extra} />
    </div>
  );
  return (
    <details className="card">
      <summary className="cursor-pointer text-lg font-semibold">Configurações do bolão</summary>
      <form onSubmit={salvar} className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">{campo("nome", "Nome", { maxLength: 80 })}</div>
        {campo("concurso", "Concurso", { inputMode: "numeric" })}
        {campo("dataSorteio", "Data do sorteio (Brasília)", { type: "datetime-local" })}
        {campo("preco", "Preço da aposta simples (R$)", { inputMode: "decimal" })}
        {campo("estimativa", "Prêmio estimado (R$), para a calculadora", { inputMode: "decimal" })}
        {campo("maxDezenas", "Máx. de dezenas por jogo do participante", { type: "number", min: 6, max: 20 })}
        {campo("maxParticipantes", "Máx. de participantes", { type: "number", min: 1, max: 1000 })}
        <div className="sm:col-span-2">{campo("pixChave", "Chave Pix (e-mail, CPF, CNPJ, +55 telefone ou aleatória)", { maxLength: 80 })}</div>
        {campo("pixNome", "Nome do recebedor (até 25)", { maxLength: 25 })}
        {campo("pixCidade", "Cidade do recebedor (até 15)", { maxLength: 15 })}
        <div className="sm:col-span-2">{campo("instrucoes", "Instruções de pagamento (opcional)", { maxLength: 400 })}</div>
        <button type="submit" className="btn sm:col-span-2 sm:justify-self-start">
          Salvar configurações
        </button>
      </form>
    </details>
  );
}

function Historico({ base }: { base: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <details className="card" onToggle={(e) => setAberto((e.target as HTMLDetailsElement).open)}>
      <summary className="cursor-pointer text-lg font-semibold">Histórico</summary>
      {aberto && <ListaEventos base={base} />}
    </details>
  );
}
function ListaEventos({ base }: { base: string }) {
  const { dados, erro, recarregar } = useRecurso<EventoDTO[]>(`${base}/eventos`);
  if (erro) return <ErroDeCarga status={erro.status} mensagem={erro.message} tentar={recarregar} />;
  if (!dados) return <Carregando />;
  return (
    <ol className="mt-3 space-y-2 text-sm">
      {dados.map((e) => (
        <li key={e.id} className="border-l-2 border-line pl-3">
          <p>{e.descricao}</p>
          <p className="text-xs text-muted">{formatarDataHora(e.criadoEm)}</p>
        </li>
      ))}
    </ol>
  );
}

export default function GestaoBolao() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const base = `/boloes/${encodeURIComponent(id)}`;
  const { dados: r, erro, carregando, recarregar } = useRecurso<ResumoAdmin>(base);
  const [aviso, setAvisoState] = useState<{ erro?: string; ok?: string }>({});
  const [novoNome, setNovoNome] = useState("");
  const [novoZap, setNovoZap] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const avisar: Avisar = (a) => {
    setAvisoState(a);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (carregando) return <CarregandoPagina />;
  if (erro?.status === 401) {
    router.replace("/admin");
    return null;
  }
  if (erro?.status === 404) return <NaoEncontrado />;
  if (erro) return <Casca><ErroDeCarga status={erro.status} mensagem={erro.message} tentar={recarregar} /></Casca>;
  if (!r) return null;
  const b = r.bolao;
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/entrar/${b.convite}`;
  const msgZap = `Bolão "${b.nome}": entre pelo link, escolha seus jogos e pague por Pix: ${link}`;

  const faz = async (fn: () => Promise<unknown>, ok?: string) => {
    try {
      await fn();
      if (ok) avisar({ ok });
      await recarregar();
    } catch (e) {
      avisar({ erro: mensagemDe(e) });
    }
  };
  const jogosDe = (pid: number) => r.jogos.filter((j) => j.participanteId === pid);
  const aRegistrar = r.jogos.filter((j) => !j.registrado && r.participantes.find((p) => p.id === j.participanteId)?.situacao === "quitado").length;

  return (
    <Casca>
      <Link href="/admin" className="text-sm font-semibold text-brand">
        ← Todos os bolões
      </Link>
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{b.nome}</h1>
        <p className="text-sm text-muted">
          {b.tipo === "VIRADA" ? "Mega da Virada" : "Mega-Sena"}
          {b.concurso ? ` · concurso ${b.concurso}` : ""}
          {b.dataSorteio ? ` · sorteio ${formatarDataHora(b.dataSorteio)}` : ""} · aposta simples {formatBRL(b.precoSimples)}
        </p>
      </header>
      <Toast aviso={aviso} />
      {b.travado && (
        <p className="rounded-xl border border-warning-line bg-warning-soft p-3 text-sm text-warning-fg">
          {b.resultado ? "Resultado lançado." : "O horário do sorteio já passou."} Inscrições e jogos novos estão fechados, e qualquer mudança que mexa no rateio pede
          confirmação e fica no histórico. Só jogos registrados na Caixa entram no rateio.
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Numero rotulo="Participantes" valor={String(r.participantes.length)} />
        <Numero rotulo="Arrecadado" valor={formatBRL(r.totais.arrecadado)} />
        <Numero rotulo="A receber" valor={formatBRL(Math.max(0, r.totais.devido - r.totais.arrecadado))} />
        <Numero rotulo="Registrados" valor={`${r.totais.jogosRegistrados} de ${r.totais.jogos}`} />
      </section>

      <Secao titulo="Link de convite" id="convite">
        <p className="break-all rounded-xl bg-background p-3 font-mono text-xs">{link}</p>
        <div className="flex flex-wrap gap-2">
          <BotaoCopiar texto={link} rotulo="Copiar link" />
          <a className="btn-ghost" href={`https://wa.me/?text=${encodeURIComponent(msgZap)}`} target="_blank" rel="noopener noreferrer">
            Compartilhar no WhatsApp
          </a>
          <Link className="btn-ghost" href={`/b/${b.convite}`}>
            Ver como participante
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <span className={`chip ${b.inscricoesAbertas ? "bg-brand-soft text-brand-dark" : "bg-warning-soft text-warning-fg"}`}>
            Inscrições {b.inscricoesAbertas ? "abertas" : "encerradas"}
          </span>
          {(b.inscricoesAbertas || !b.travado) && (
            <button type="button" className="btn-ghost" onClick={() => faz(() => api.post(`${base}/inscricoes`, { abertas: !b.inscricoesAbertas }))}>
              {b.inscricoesAbertas ? "Encerrar inscrições" : "Reabrir inscrições"}
            </button>
          )}
          <button
            type="button"
            className="btn-ghost"
            onClick={() => window.confirm("Gerar um link novo? O antigo para de funcionar.") && faz(() => api.post(`${base}/convite`), "Novo link gerado.")}
          >
            Gerar novo link
          </button>
        </div>
        {!b.pix && <p className="text-xs text-warning-fg">Configure a chave Pix (em Configurações) para os participantes pagarem com QR Code.</p>}
      </Secao>

      <Secao titulo="Participantes e pagamentos" id="participantes">
        {r.participantes.length === 0 && <p className="text-sm text-muted">Ninguém entrou ainda. Mande o link no grupo.</p>}
        <div className="space-y-2">
          {r.participantes.map((p) => (
            <Participante key={p.id} p={p} jogos={jogosDe(p.id)} preco={b.precoSimples} base={base} avisar={avisar} recarregar={recarregar} />
          ))}
        </div>
        <form
          className="grid gap-2 border-t border-line pt-3 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            void faz(() => api.post(`${base}/participantes`, { nome: novoNome, whatsapp: novoZap }), "Participante adicionado.").then(() => {
              setNovoNome("");
              setNovoZap("");
            });
          }}
        >
          <input aria-label="Nome do novo participante" required minLength={2} maxLength={60} placeholder="Nome" className="input" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
          <input aria-label="WhatsApp do novo participante" maxLength={30} placeholder="WhatsApp (opcional)" className="input" value={novoZap} onChange={(e) => setNovoZap(e.target.value)} />
          <button type="submit" className="btn-ghost">
            Adicionar
          </button>
        </form>
      </Secao>

      <Secao titulo="Registrar os jogos na Caixa" id="registro">
        <p className="text-sm text-muted">
          {aRegistrar > 0 ? `${aRegistrar} jogo(s) pago(s) ainda não registrado(s).` : "Nenhum jogo pago pendente de registro."} Chance atual do bolão: {umEm(r.chance.umEm)}.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/${b.id}/digitar`} className="btn">
            Modo digitação (app da Caixa)
          </Link>
          <Link href={`/admin/${b.id}/imprimir`} className="btn-ghost">
            Folha para a lotérica
          </Link>
          <a href={`${API_URL}${base}/exportar.csv`} className="btn-ghost">
            Baixar planilha (CSV)
          </a>
        </div>
      </Secao>

      <Resultado r={r} base={base} avisar={avisar} recarregar={recarregar} />
      <Configuracoes key={JSON.stringify(b)} r={r} base={base} avisar={avisar} recarregar={recarregar} />
      <Historico base={base} />

      <details className="card">
        <summary className="cursor-pointer text-lg font-semibold text-danger-fg">Excluir bolão</summary>
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            void api
              .post(`${base}/excluir`, { confirmacao })
              .then(() => router.replace("/admin"))
              .catch((err) => avisar({ erro: mensagemDe(err) }));
          }}
        >
          <label htmlFor="confirmacao" className="label">
            Digite o nome exato do bolão (apaga participantes, jogos e histórico)
          </label>
          <input id="confirmacao" className="input" placeholder={b.nome} value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
          <button type="submit" className="btn-danger" disabled={confirmacao !== b.nome}>
            Excluir definitivamente
          </button>
        </form>
      </details>
    </Casca>
  );
}
