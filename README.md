# Chat Application : Communicates with Copilot Studio Agent

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Setup](#setup)
    - [Usage](#usage)
- [Resources](#resources)


## Overview

This project demonstrates how to integrate a React Native application with a Copilot Studio agent using the [Direct Line API](https://learn.microsoft.com/en-us/azure/ai-services/bot-services/bot-builder-directline-overview).

## Getting Started

### Prerequisites

- A Copilot Studio agent deployed and configured for Direct Line channel.
- Your Direct Line secret or token.
- Node.js and npm installed.
- Clone the repository
  ```bash
  git clone https://github.com/vcse59/Generative-AI-Copilot-DirectLine-Application.git
  ```

### Setup

1. **Install dependencies**

    ```bash
    npm install
    ```

2. **Configure Direct Line**

    Update `src/service/DirectLineClass.js" with your Direct Line secret or token:
    `const DIRECT_LINE_SECRET = "<YOUR DIRECT LINE SECRET>"`

3. **Start the Application**

    Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project and run:

    ```bash
    npm run web
    ```

### Usage

- The app connects to your Copilot Studio agent via Direct Line.
- You can send and receive messages in real time.

## Resources

- [React Native Website](https://reactnative.dev) - Learn more about React Native.
- [Direct Line API Documentation](https://learn.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-direct-line-3-0-api-reference?view=azure-bot-service-4.0) - Learn about Direct Line integration.
- [React Native Environment Setup](https://reactnative.dev/docs/environment-setup) - Overview of React Native environment setup.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - The open source GitHub repository for React Native.

