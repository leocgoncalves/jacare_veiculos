# Guia Visual - Jacare Veiculos

## 1) Essencia da Marca

### Posicionamento
Jacare Veiculos e uma loja de veiculos proprios (carros e motos) com foco em confianca, selecao rigorosa e atendimento rapido.

### Personalidade da marca
- Imponente
- Confiavel
- Direta
- Premium acessivel

### Promessa principal
"Veiculos selecionados com criterio, negociacao transparente e atendimento que resolve."

### Tom de voz
- Frases curtas, objetivas e seguras
- Sem exagero publicitario
- Linguagem comercial clara

Exemplos:
- "Seu proximo veiculo esta aqui."
- "Estoque revisado e pronto para voce."
- "Atendimento rapido via WhatsApp."

---

## 2) Direcao do Logo e Mascote (Jacare)

### Conceito recomendado
Usar o jacare como simbolo de forca e controle, em estilo **emblema** (escudo ou selo), sem traço infantil.

### Versoes de logo
- **Principal:** simbolo (cabeca de jacare estilizada) + wordmark "Jacare Veiculos"
- **Secundaria horizontal:** simbolo a esquerda + texto
- **Icone:** apenas simbolo do jacare (favicon, avatar, app)

### Regras de construcao
- Formas geometricas, linhas firmes, pouca complexidade
- Evitar detalhes muito finos (para nao perder leitura em tamanho pequeno)
- Evitar caricatura/cartoon

### Area de protecao
- Manter margem minima de 1x a altura do olho do jacare ao redor do logo

### Tamanho minimo
- Digital: 120px largura (logo completo)
- Icone: 24px (versao simplificada)

---

## 3) Sistema de Cores

### Paleta principal
- **Verde Jacare 900 (primaria):** `#0F3D2E`
- **Grafite 900 (fundo escuro):** `#111318`
- **Cinza 100 (superficies claras):** `#F3F5F7`
- **Branco:** `#FFFFFF`

### Cor de destaque (CTA)
Escolher 1 das duas opcoes:
- **Dourado Premium:** `#C8A24C`
- **Laranja Performance:** `#C96A2B`

> Recomendacao inicial: Dourado Premium para reforcar autoridade da marca.

### Cores de estado
- **Sucesso:** `#1F8A4D`
- **Aviso:** `#C07A1A`
- **Erro:** `#B42318`
- **Info:** `#175CD3`

### Proporcao de uso
- 60% neutros (cinza/branco)
- 30% verde + grafite
- 10% destaque (dourado/laranja)

---

## 4) Tipografia

### Fontes
- **Titulos e chamadas:** Montserrat (600/700/800)
- **Textos e UI:** Inter (400/500/600)

### Escala tipografica (desktop)
- H1: 48/56 - 800
- H2: 36/44 - 700
- H3: 28/36 - 700
- H4: 22/30 - 600
- Body L: 18/28 - 400
- Body: 16/24 - 400
- Small: 14/20 - 400
- Caption: 12/16 - 500

### Escala mobile (base)
- H1: 34/42
- H2: 28/36
- Body: 16/24

---

## 5) Estilo Visual da Interface

### Diretriz geral
- Interface clean, com blocos fortes e espacamento respirado
- Fotos dos veiculos sempre protagonistas
- Cartoes com sombra leve e borda discreta
- Contraste alto para leitura e conversao

### Shape language
- Raios de borda: 10px (cards), 12px (inputs), 14px (botoes)
- Sombras:
  - `shadow-sm`: cards comuns
  - `shadow-md`: hover e destaque
- Icons com traco consistente (2px)

### Grid e espacamento
- Grid base: 12 colunas (desktop), 4 colunas (mobile)
- Spacing scale: 4, 8, 12, 16, 24, 32, 40, 56, 72

---

## 6) Componentes de UI (MVP)

### Botao primario
- Fundo: verde primario
- Texto: branco
- Hover: escurecer 8%
- Estado disabled com opacidade 50%

### Botao destaque (acao comercial)
- Fundo: dourado (ou laranja escolhido)
- Texto: grafite escuro
- Uso: "Tenho interesse", "Falar no WhatsApp"

### Campo de formulario
- Fundo branco
- Borda cinza media
- Focus ring verde
- Erro com borda vermelha e texto auxiliar

### Card de veiculo
- Foto (16:9)
- Nome do modelo
- Ano | Km | Cambio
- Preco com destaque
- CTA "Tenho interesse"

### Badge de status
- "Disponivel", "Reservado", "Vendido"
- Cores semaforo com contraste AA

---

## 7) Estrutura de Paginas

## Home
1. Hero com titulo forte + busca rapida
2. Veiculos em destaque
3. Beneficios da loja
4. Bloco de credibilidade (depoimentos/selos)
5. CTA final para contato

## Estoque
- Filtros laterais (desktop) e drawer (mobile)
- Ordenacao por preco/ano/km
- Paginacao simples

## Detalhe do Veiculo
- Galeria principal + miniaturas
- Bloco de especificacoes
- Bloco de condicoes e contato
- CTA fixo no mobile

## Contato
- Formulario curto
- WhatsApp direto
- Mapa e horario

---

## 8) Conteudo Base (copy inicial)

### Hero (Home)
**Titulo:** "Seu proximo carro ou moto esta na Jacare Veiculos."  
**Subtitulo:** "Estoque selecionado, procedencia clara e atendimento rapido."  
**CTA primario:** "Ver estoque"  
**CTA secundario:** "Falar no WhatsApp"

### Sessao de confianca
**Titulo:** "Compra segura com atendimento de verdade"  
**Bullets:**
- Veiculos selecionados com criterio
- Atendimento rapido e transparente
- Processo simples do primeiro contato ate a entrega

### CTA final
**Titulo:** "Encontrou o veiculo ideal?"  
**Texto:** "Fale com nossa equipe e receba atendimento imediato."  
**Botao:** "Tenho interesse"

---

## 9) Fotografia e Midia

### Padrao de fotos
- Fundo limpo sempre que possivel
- Luz uniforme
- Fotos obrigatorias: frente, traseira, laterais, painel, interior, rodas
- Evitar poluicao visual e marcas d'agua excessivas

### Tratamento
- Cor realista, sem saturacao exagerada
- Nitidez moderada
- Corte consistente entre anuncios

---

## 10) UX de Conversao (lead first)

### Formulario ideal (baixo atrito)
Campos:
- Nome (obrigatorio)
- WhatsApp (obrigatorio)
- Mensagem (opcional)

### Regras
- No maximo 3 campos iniciais
- Botao claro: "Receber contato"
- Confirmacao imediata: "Recebemos seu contato, responderemos em breve."

### Microcopys de confianca
- "Seus dados serao usados apenas para contato sobre este veiculo."
- "Sem spam."

---

## 11) Acessibilidade e Qualidade

- Contraste minimo AA em textos e botoes
- Tamanho minimo de fonte: 16px em textos principais
- Estados de foco visiveis em todos os elementos interativos
- Labels e mensagens de erro claras nos formularios
- Alt text em imagens de veiculos

---

## 12) Tokens de Design (pronto para codigo)

```css
:root {
  --color-primary-900: #0F3D2E;
  --color-bg-dark: #111318;
  --color-surface-100: #F3F5F7;
  --color-white: #FFFFFF;
  --color-accent: #C8A24C; /* opcao premium */

  --radius-sm: 10px;
  --radius-md: 12px;
  --radius-lg: 14px;

  --shadow-sm: 0 2px 8px rgba(17, 19, 24, 0.08);
  --shadow-md: 0 6px 20px rgba(17, 19, 24, 0.14);
}
```

---

## 13) Checklist de aprovacao da identidade

- [ ] Logo com jacare em estilo emblema aprovado
- [ ] Paleta principal validada (verde/grafite/neutros + destaque)
- [ ] Tipografia aprovada
- [ ] Cards de veiculo e botoes aprovados
- [ ] Home com copy principal aprovada
- [ ] Formulario de lead validado

---

## 14) Proximos Passos (execucao)

1. Fechar versao final do logo (principal + icone + negativo)
2. Criar wireframe high-fidelity da Home, Estoque e Detalhe
3. Implementar design system base (cores, fontes, componentes)
4. Construir MVP do site com foco total em geracao de lead
5. Medir conversao por pagina e otimizar continuamente

