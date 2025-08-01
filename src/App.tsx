



import { AuthenticationProvider } from "./components/auth/AuthenticationProvider";
import { LandingHero } from "./components/layout/LandingHero";



function EnneagramApp() {
  return (
    <main className="app-main">
      <LandingHero />
      <AuthenticationProvider>
        {/* Survey and results components will be added here. */}
        {/* The AuthenticationProvider renders login/registration UI itself. */}
        <></>
      </AuthenticationProvider>
    </main>
  );
}



function App() {
  return <EnneagramApp />;
}

export default App;
