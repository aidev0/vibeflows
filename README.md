# VibeFlows

AI-Powered Marketing Automation platform that enables users to create powerful marketing workflows with AI agents and smart decision flows.

## Features

- **AI Agents**: Intelligent automation agents for marketing tasks
- **Smart Flows**: Visual workflow builder with decision branching
- **Automation**: Streamlined marketing automation processes
- **User Management**: Authentication and user session management
- **Chat Interface**: Interactive chat-based workflow management
- **N8N Integration**: Workflow visualization and management

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Authentication**: Auth0
- **Database**: MongoDB
- **UI**: React with Tailwind CSS
- **Visualization**: React Flow (@xyflow/react)
- **Icons**: Lucide React
- **Code Editor**: Monaco Editor

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB instance
- Auth0 account for authentication

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vibeflows
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with your configuration:
```env
# Auth0 Configuration
AUTH0_SECRET=
AUTH0_BASE_URL=
AUTH0_ISSUER_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=

# MongoDB
MONGODB_URI=

# Other configuration as needed
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
app/
├── api/                 # API routes
│   ├── agents/         # AI agents management
│   ├── auth/           # Auth0 authentication
│   ├── chats/          # Chat functionality
│   ├── flows/          # Workflow management
│   └── ...
├── components/         # React components
├── dashboard/          # Dashboard pages
├── lib/               # Utility libraries
└── utils/             # Helper utilities
```

## Key Components

- **ChatPanel**: Interactive chat interface for workflow management
- **FlowsPanel**: Visual workflow builder and manager
- **GraphPanel**: Workflow visualization using React Flow
- **N8nWorkflowViewer**: Integration with N8N workflows
- **UsersPanel**: User management interface

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is private and proprietary.