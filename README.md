# 🚀 Massa App – Review Repository

This repository is intended **for the Massa Foundation teams** to conduct a **technical review** of our application.

---

## 📦 How to run the application locally

Please follow the steps below to set up and run the project:

### 1. Clone the repository

```bash
git clone https://github.com/pymoussgithub/dApp_Manrina.git
cd dApp_Manrina
```

### 2. Install dependencies
```bash
npm install
```
### 3. Modify the smart contract address
Modify the contracts.ts file :  

```bash
cd src\config\
nano contracts.ts
```

insert your deployed smart contract address in the contracts.ts file
```bash
export const CONTRACT_ADDRESS = "your_deployed_smart_contract";
```

### 4. Build the application
```bash
npm run build
```
### 5. Start the server
```bash
npm run start
```
### 6. Open the app in your browser

Go to: http://localhost:3000

### Note : 
The .env file has to be added. Please ask Sébastien to get the .env file. 
