import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import MainStack from './src/routes/MainStack';
import { UsuarioProvider } from './src/context/UsuarioContext';

function App() {
  return (
    <SafeAreaProvider>
      <UsuarioProvider>
        <NavigationContainer>
          <MainStack />
        </NavigationContainer>
      </UsuarioProvider>
    </SafeAreaProvider>
  );
}

export default App;