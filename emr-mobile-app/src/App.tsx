import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
  IonSpinner
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { heart, chatbubbleEllipses, medkit, logOutOutline } from 'ionicons/icons';
import ComfortDashboard from './pages/ComfortDashboard';
import CareHub from './pages/CareHub';
import Pharmacy from './pages/Pharmacy';
import Login from './pages/Login';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
import '@ionic/react/css/palettes/dark.class.css';
/* import '@ionic/react/css/palettes/dark.system.css'; */

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020408] text-teal-400">
        <IonSpinner name="crescent" color="teal" />
        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mt-3">
          Securing Session...
        </p>
      </div>
    );
  }

  return (
    <IonReactRouter>
      <IonRouterOutlet>
        <Route exact path="/login">
          {isAuthenticated ? <Redirect to="/app/comfort" /> : <Login />}
        </Route>

        <Route path="/app">
          {isAuthenticated ? (
            <IonTabs>
              <IonRouterOutlet>
                <Route exact path="/app/comfort">
                  <ComfortDashboard />
                </Route>
                <Route exact path="/app/care-hub">
                  <CareHub />
                </Route>
                <Route exact path="/app/pharmacy">
                  <Pharmacy />
                </Route>
                <Route exact path="/app">
                  <Redirect to="/app/comfort" />
                </Route>
              </IonRouterOutlet>

              <IonTabBar slot="bottom">
                <IonTabButton tab="comfort" href="/app/comfort">
                  <IonIcon aria-hidden="true" icon={heart} className="w-5 h-5" />
                  <IonLabel className="text-[10px] font-sans font-bold">Comfort Hub</IonLabel>
                </IonTabButton>
                <IonTabButton tab="care-hub" href="/app/care-hub">
                  <IonIcon aria-hidden="true" icon={chatbubbleEllipses} className="w-5 h-5" />
                  <IonLabel className="text-[10px] font-sans font-bold">Care Hub</IonLabel>
                </IonTabButton>
                <IonTabButton tab="pharmacy" href="/app/pharmacy">
                  <IonIcon aria-hidden="true" icon={medkit} className="w-5 h-5" />
                  <IonLabel className="text-[10px] font-sans font-bold">Pharmacy</IonLabel>
                </IonTabButton>
                <IonTabButton tab="logout" onClick={logout}>
                  <IonIcon aria-hidden="true" icon={logOutOutline} className="w-5 h-5 text-rose-500" />
                  <IonLabel className="text-[10px] font-sans font-bold text-rose-500">Exit</IonLabel>
                </IonTabButton>
              </IonTabBar>
            </IonTabs>
          ) : (
            <Redirect to="/login" />
          )}
        </Route>

        <Route exact path="/">
          <Redirect to="/app/comfort" />
        </Route>
        
        {/* Catch-all fallback */}
        <Route render={() => <Redirect to={isAuthenticated ? "/app/comfort" : "/login"} />} />
      </IonRouterOutlet>
    </IonReactRouter>
  );
};

import { ApolloProvider } from '@apollo/client/react';
import { client } from './apolloClient';

const App: React.FC = () => (
  <ApolloProvider client={client}>
    <ThemeProvider>
      <AuthProvider>
        <IonApp>
          <AppContent />
        </IonApp>
      </AuthProvider>
    </ThemeProvider>
  </ApolloProvider>
);

export default App;

