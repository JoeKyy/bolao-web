export const CHAVE = "tema";

/** Script que roda antes da pintura para não piscar o tema errado (lê a escolha salva e marca o <html>). */
export const SCRIPT_TEMA = `try{var t=localStorage.getItem("${CHAVE}");if(t==="claro"||t==="escuro")document.documentElement.setAttribute("data-tema",t)}catch(e){}`;
