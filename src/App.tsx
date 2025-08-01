

import { AuthenticationProvider } from "./components/auth/AuthenticationProvider";
import { RegistrationForm } from "./components/auth/RegistrationForm";

function EnneagramApp() {
  return (
    <main>
      <h1>Enneagram Discovery App</h1>
      <p>Welcome! Please sign in or register to begin your Enneagram journey.</p>
      <RegistrationForm />
      {/* Survey and results components will be added here. */}
    </main>
  );
}


function App() {
  return (
    <AuthenticationProvider>
      <EnneagramApp />
    </AuthenticationProvider>
  );
}

export default App;
