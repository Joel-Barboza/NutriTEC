import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen.jsx';
import RootTabs from './RootTabs.jsx';

const Stack = createNativeStackNavigator();

const MainStack = () => {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MainTabs" component={RootTabs} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default MainStack;