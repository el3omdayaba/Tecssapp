import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import SignupScreen from "./screens/SignupScreen";

const Stack = createNativeStackNavigator();

const prefix = Linking.createURL('/');

export default function App() {
  const [initialReferral, setInitialReferral] = useState(null);

  useEffect(() => {
    const getReferral = async () => {
      const url = await Linking.getInitialURL();
      console.log("🌐 Initial deep link URL:", url);
  
      if (url) {
        const parsed = Linking.parse(url);
        console.log("🔍 Parsed deep link object:", parsed);
  
        const code = parsed.path || null;
        console.log("🏷️ Extracted referral code:", code);
  
        if (code?.startsWith("hero_")) {
          setInitialReferral(code);
        }
      } else {
        console.log("⚠️ No deep link URL found, defaulting to hero_0");
      }
    };
    getReferral();
  }, []);
  
  

  return (
    <NavigationContainer linking={{ prefixes: [prefix] }}>
      <Stack.Navigator>
        <Stack.Screen name="Signup">
          {(props) => <SignupScreen {...props} initialReferralCode={initialReferral} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
