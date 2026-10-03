# Eufrosine

<sub>O nome vem de Eufrosine, uma das três Graças. [Por quê?](MITO.md)</sub>

**Site de aniversário gratuito: contagem regressiva, confirmação de presença e lista de presentes que some conforme os convidados escolhem.**

HTML, CSS e JavaScript puros, sem build e sem servidor próprio. Publica no GitHub Pages de graça,
e a lista de presentes mora numa planilha do Google Sheets que você edita como qualquer planilha.

**Demonstração:** [luccas-amorim.github.io/eufrosine](https://luccas-amorim.github.io/eufrosine/). Sem
planilha configurada, o site roda em modo demonstração: a lista vem de `exemplo-presentes.json` e
nada do que se digita sai do navegador.

> **Estágio: primeira versão.** Nasceu de sites de aniversário feitos à mão, ano após ano, e está
> sendo generalizado para qualquer pessoa usar.

---

## O que tem

- **Contagem regressiva** até a festa, que vira "é hoje!" na hora certa.
- **Confirmação de presença**: nome e se vai sozinho ou acompanhado, gravados numa planilha só
  de convidados.
- **Lista de presentes** agrupada por faixa de preço. Quando alguém confirma um presente, ele sai da
  lista para os próximos; quem escolheu fica registrado na planilha, mas **nunca** aparece para os
  outros convidados.
- **"O presente que você escolheu"**: o convidado revê o item e o link da loja quando volta ao site,
  e pode mandar o link para o próprio WhatsApp.
- Modo claro e escuro, botão de compartilhar, animação de confete e respeito a quem prefere menos
  movimento.

## Como usar

1. Use este repositório como modelo (**Use this template**, ou faça um fork).
2. Edite **`config.js`**: nome, título, data e hora, mensagem, cores e, se quiser, uma imagem
   central (PNG com fundo transparente). Sem imagem, o site mostra a inicial do nome num círculo.
3. Ative o GitHub Pages: Settings → Pages → Deploy from branch → `main` / `root`.
4. Para a lista e as confirmações funcionarem de verdade, configure as planilhas (abaixo) e cole a
   URL do Apps Script em `apiUrl`, no `config.js`.

**Sobre o endereço:** o campo `local` existe, mas o site é público. Se não quiser que qualquer pessoa
com o link saiba onde é a festa, deixe vazio e mande o endereço só para quem confirmou.

## Planilhas e Apps Script

São **dois arquivos** do Google Sheets, e não duas abas do mesmo arquivo, de propósito: quem faz
aniversário pode abrir a planilha de convidados para acompanhar as confirmações sem esbarrar na de
presentes e estragar a surpresa.

**Arquivo 1 — presentes (aba `presentes`):** colunas `id`, `presente`, `preco`, `status`
(`disponivel` / `reservado`), `tamanho`, `cor`, `link` e `quem`. A coluna `quem` é preenchida
sozinha com o nome de quem reservou e **nunca** é devolvida ao site.

**Arquivo 2 — convidados (aba `confirmacoes`):** colunas `nome`, `acompanhado`, `criado_em`. Basta
a linha de cabeçalho; o script preenche o resto.

**Apps Script:** abra Extensões → Apps Script, cole o conteúdo de [`apps-script.gs`](apps-script.gs),
troque os dois IDs (vêm da URL de cada planilha: `.../spreadsheets/d/<ID>/edit`) e publique em
Implantar → Nova implantação → App da Web, com acesso para "Qualquer pessoa". Copie a URL que termina
em `/exec` para `apiUrl`.

Pontos que já deram dor de cabeça:

- Use `SpreadsheetApp.openById(...)`, nunca `getActive()`: um Web App não tem planilha ativa
  confiável.
- Confira o nome da aba: um espaço no final (`"presentes "`) faz `getSheetByName` devolver `null`.
- Depois de editar o script, é preciso **Implantar → Gerenciar implantações → editar → Nova
  versão**. Só salvar não atualiza a URL já publicada.

## Privacidade

- O navegador do convidado guarda, só no aparelho dele (`localStorage`): o tema escolhido, o nome
  digitado e o presente que ele reservou. Nada disso vai para servidor nenhum além da planilha.
- Quem deu cada presente fica só na planilha de presentes, visível apenas para quem a administra.
- Os nomes de quem confirmou presença ficam na planilha de convidados, e só lá.

## Apoie

A Eufrosine é e continua gratuita. Se ele foi útil, apoie em
[GitHub Sponsors](https://github.com/sponsors/luccas-amorim) ou por
[PIX](https://luccas-amorim.github.io/apoie/).

## Licença

[MIT](LICENSE).
