"use client";
import { useState, type FormEvent } from "react";
import { ErroDaApi } from "./api";

type Controle = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** Explica em português por que o navegador considera o campo inválido. */
export function motivoDoCampo(el: Controle): string {
  const v = el.validity;
  const tam = el.value.length;
  if (v.valueMissing) return el.type === "checkbox" ? "Marque esta opção para continuar." : "Preencha este campo.";
  if (v.typeMismatch) {
    if (el.type === "email") return "Informe um e-mail válido, como nome@exemplo.com.";
    return "O formato não é válido.";
  }
  if (v.tooShort) return `Use pelo menos ${el.getAttribute("minlength")} caracteres (agora tem ${tam}).`;
  if (v.tooLong) return `Use no máximo ${el.getAttribute("maxlength")} caracteres.`;
  if (v.patternMismatch) return "O formato não é válido.";
  if (v.rangeUnderflow) return `O valor mínimo é ${el.getAttribute("min")}.`;
  if (v.rangeOverflow) return `O valor máximo é ${el.getAttribute("max")}.`;
  if (v.badInput) return "Valor inválido.";
  return el.validationMessage || "Valor inválido.";
}

/**
 * Validação de formulário que diz QUAL campo e POR QUÊ: marca o campo, escreve o motivo embaixo
 * dele e leva o foco ao primeiro erro. Use com `<form noValidate>` e `<Campo erro={erros[id]}>`.
 */
export function useValidacao() {
  const [erros, setErros] = useState<Record<string, string>>({});

  /** Chame no começo do envio. Falso = há campo inválido (já marcado); não envie. */
  function validar(e: FormEvent<HTMLFormElement>): boolean {
    const novos: Record<string, string> = {};
    let primeiro: Controle | null = null;
    for (const el of Array.from(e.currentTarget.elements)) {
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) continue;
      if (!el.id || !el.willValidate || el.validity.valid) continue;
      novos[el.id] = motivoDoCampo(el);
      primeiro ??= el;
    }
    setErros(novos);
    primeiro?.focus();
    return primeiro === null;
  }

  /** Erro que só o envio descobre (ex.: confirmação diferente da senha). */
  function marcar(id: string, motivo: string) {
    setErros({ [id]: motivo });
    document.getElementById(id)?.focus();
  }

  function limpar(id: string) {
    setErros((atual) => {
      if (!(id in atual)) return atual;
      const resto = { ...atual };
      delete resto[id];
      return resto;
    });
  }

  /**
   * Resposta de validação da API: `mapa` liga o nome do campo na API ao id do campo na tela.
   * Verdadeiro se algum campo foi marcado; senão mostre `mensagemDe(err)` no aviso.
   */
  function doServidor(err: unknown, mapa: Record<string, string>, idSenha?: string): boolean {
    // Recusas da política de senha (senha_curta, senha_comum...) pertencem ao campo da senha.
    if (err instanceof ErroDaApi && idSenha && err.codigo.startsWith("senha_")) {
      marcar(idSenha, err.message);
      return true;
    }
    if (!(err instanceof ErroDaApi) || !err.campos) return false;
    const novos: Record<string, string> = {};
    for (const [campo, motivo] of Object.entries(err.campos)) if (mapa[campo]) novos[mapa[campo]] = motivo;
    const ids = Object.keys(novos);
    if (!ids.length || ids.length < Object.keys(err.campos).length) return false;
    setErros(novos);
    document.getElementById(ids[0])?.focus();
    return true;
  }

  const total = Object.keys(erros).length;
  const resumo = total ? (total === 1 ? "Corrija o campo destacado abaixo." : `Corrija os ${total} campos destacados abaixo.`) : null;
  return { erros, validar, marcar, limpar, doServidor, resumo };
}
