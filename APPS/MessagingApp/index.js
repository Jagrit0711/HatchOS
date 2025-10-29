// Import polyfill FIRST to patch errors before anything else loads
import './polyfill';

import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
registerRootComponent(App);
