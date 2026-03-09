# 📋 Escala de Extração - Citroescala

Um sistema de gestão de escalas, folgas e horários de janta para o setor de operações, desenvolvido como um **Progressive Web App (PWA)**.

## 🚀 Funcionalidades
- **Gestão de Equipe:** Cadastro, edição e remoção de colaboradores com cargos específicos.
- **Cálculo de Folgas:** Sistema inteligente baseado em lógica de letras (A-F) para determinar quem está de folga em datas específicas.
- **Escala de Janta:** Gerenciamento automático de slots de janta, com tratamento especial para operadores de máquinas.
- **Integração em Tempo Real:** Sincronização instantânea entre dispositivos (Desktop e Mobile) via Firebase Firestore.
- **Offline First:** Funciona como um aplicativo nativo no celular (PWA).

## 🛠️ Tecnologias Utilizadas
- **Frontend:** HTML5, CSS3 (Vanilla + Tailwind CSS)
- **Backend:** Firebase Firestore (Realtime Database)
- **Hospedagem:** Firebase Hosting
- **Bibliotecas:** [Flatpickr](https://flatpickr.js.org/) (Seleção de datas)

## 📦 Como rodar o projeto localmente
1. Clone este repositório:
   ```bash
   git clone https://github.com/SEU_USUARIO/escalas.git
   ```
2. Abra o arquivo `index.html` em um servidor local (como o Live Server do VS Code).
3. Certifique-se de configurar suas próprias credenciais no arquivo `firebase-config.js`.

## 🛡️ Licença
Este projeto foi desenvolvido por **isisb**. Todos os direitos reservados.
