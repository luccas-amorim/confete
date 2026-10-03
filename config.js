// Tudo o que muda de uma festa para outra fica aqui. O resto do site lê estes valores.
window.EUFROSINE = {
  // Quem faz aniversário, como deve aparecer no site (título da aba, rodapé, mensagens).
  nome: "Fulana",

  // Frase grande abaixo da imagem. Ex.: "trinta anos", "40 primaveras", "é aniversário!".
  titulo: "trinta anos",

  // Data e hora da festa, com fuso. Deixe "" para o modo demonstração (30 dias a partir de hoje).
  data: "",

  // Endereço ou nome do lugar. Opcional: deixe "" para não mostrar nada.
  // Lembre que o site é público; prefira mandar o endereço só para os convidados.
  local: "",

  // Imagem central (PNG com fundo transparente fica melhor). Deixe "" para usar a inicial do nome.
  imagem: "",

  // Texto da lista de presentes.
  mensagem:
    "Quer me dar um presente? Escolha um da lista; quando você confirmar, ele some, e assim ninguém repete.",

  // Assinatura do rodapé.
  assinatura: "com carinho",

  // Emoji usado nas mensagens de agradecimento.
  emoji: "💙",

  // URL do Google Apps Script publicado como Web App (termina em /exec). Veja o README.
  // Vazia = modo demonstração, com a lista de exemplo-presentes.json e nada enviado a lugar nenhum.
  apiUrl: "",

  // Faixas de preço que agrupam o menu de presentes (em reais). Cada número é o teto de uma faixa.
  faixasDePreco: [100, 200, 300, 500],

  // Cores. "principal" é a cor da marca da festa; o resto se ajusta a partir dela.
  cores: {
    principal: "#1800AC",
    principalEscura: "#10007A",
    suave: "#ECE9FB",
    // versões para o modo escuro
    principalNoEscuro: "#8F84FF",
    principalEscuraNoEscuro: "#ABA2FF",
    suaveNoEscuro: "#1C1454",
  },
};
