# Sistema de Fretes - Controle de Viagens e Abastecimentos

Aplicação web mobile-friendly para motoristas registrarem viagens e abastecimentos, com cálculos automáticos de totais.

## Funcionalidades

- Login com autenticação JWT
- Painel do administrador para cadastrar/gerenciar usuários
- Registro de viagens com cálculo automático do total de frete peso
- Registro de abastecimentos com cálculo automático de litros e valor total
- Placa vinculada ao usuário preenchida automaticamente
- Nome do motorista puxado automaticamente do login
- Design responsivo (mobile-first)

## Segurança

- Senhas hasheadas com bcrypt (12 rounds)
- Autenticação via JWT com expiração de 12h
- Rate limiting global e específico para login
- Headers de segurança via Helmet
- Sanitização de todas as entradas (XSS, injection)
- CORS restritivo
- Dados sensíveis nunca expostos ao frontend
- Nenhuma chave de acesso no código fonte

## Pré-requisitos

- Node.js 18+
- npm

## Instalação

```bash
# Backend
cd backend
npm install
cp .env.example .env  # Edite o JWT_SECRET para produção!
npm run seed          # Cria o admin padrão

# Frontend
cd frontend
npm install
```

## Executar em desenvolvimento

```bash
# Terminal 1 - Backend (porta 3001)
cd backend
npm run dev

# Terminal 2 - Frontend (porta 5173)
cd frontend
npm run dev
```

Acesse: http://localhost:5173

## Uso

1. Faça login como admin
2. Vá em "Admin" para cadastrar motoristas (com placa vinculada)
3. Passe o email/senha para o motorista
4. O motorista faz login e registra viagens e abastecimentos
5. Os totais são calculados automaticamente