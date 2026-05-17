import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { pulse, chatbubbleEllipses, medkit } from 'ionicons/icons';
import RecoveryDashboard from './pages/RecoveryDashboard';
import CareHub from './pages/CareHub';
import Pharmacy from './pages/Pharmacy';
import { ThemeProvider } from './contexts/ThemeContext';

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

const App: React.FC = () => (
  <ThemeProvider>
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/recovery">
              <RecoveryDashboard />
            </Route>
            <Route exact path="/care-hub">
              <CareHub />
            </Route>
            <Route path="/pharmacy">
              <Pharmacy />
            </Route>
            <Route exact path="/">
              <Redirect to="/recovery" />
            </Route>
          </IonRouterOutlet>
          <IonTabBar slot="bottom">
            <IonTabButton tab="recovery" href="/recovery">
              <IonIcon aria-hidden="true" icon={pulse} className="w-5 h-5" />
              <IonLabel className="text-[10px] font-sans font-bold">Recovery</IonLabel>
            </IonTabButton>
            <IonTabButton tab="care-hub" href="/care-hub">
              <IonIcon aria-hidden="true" icon={chatbubbleEllipses} className="w-5 h-5" />
              <IonLabel className="text-[10px] font-sans font-bold">Care Hub</IonLabel>
            </IonTabButton>
            <IonTabButton tab="pharmacy" href="/pharmacy">
              <IonIcon aria-hidden="true" icon={medkit} className="w-5 h-5" />
              <IonLabel className="text-[10px] font-sans font-bold">Pharmacy</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  </ThemeProvider>
);

export default App;
