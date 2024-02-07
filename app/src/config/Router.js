import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StatusBar,
  BackHandler,
  Alert,
  Linking,
  TouchableOpacity
} from 'react-native';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import MCIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import EvilIcon from 'react-native-vector-icons/EvilIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, TransitionPresets  } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';

import c from '../assets/constants';
const color = c.colors;

import Categories from '../screens/Categories';
import CategoryImageList from '../screens/CategoryImageList';
import ImageView from '../screens/ImageView';
import Hot from '../screens/Hot';
import Random from '../screens/Random';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const HeaderDrawerButton = ({ navigation }) => (
  <TouchableOpacity
    onPress={() => navigation.toggleDrawer()}
    style={{ minWidth: 40, position: 'absolute', left: 10 }}>
      <EvilIcon name='navicon' color={color.accent} size={40} />
  </TouchableOpacity>
);

const stackStyles = {
  headerTitleStyle: {
    fontFamily: 'Sriracha',
    color: '#fff'
  },
  headerStyle: {
    backgroundColor: color.darkBackground,
    elevation: 5,
    borderTopWidth: 1,
    borderColor: color.border,
  }
};

const CategoryStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        ...TransitionPresets.ModalPresentationIOS,
        headerMode: 'float',
        gestureEnabled: true,
        ...stackStyles,
        headerBackImage: (tintColor) => (<IonIcon name='ios-arrow-back' color={color.accent} size={40} />) }}>
      <Stack.Screen
        name="Categories"
        component={Categories}
        options={({ navigation, route }) => ({
          title: 'Categories',
          headerLeft: () => <HeaderDrawerButton navigation={navigation} /> })} />
      <Stack.Screen
        name="CategoryImageList"
        component={CategoryImageList}
        options={({ route }) => ({ title: route.params.title })} />
      <Stack.Screen
        name="ImageViewCategory"
        component={ImageView}
        options={({ route }) => ({
         title: '',
         headerTransparent: true,
         headerBackground: () => (<View style={{ width: '100%', height: '100%', backgroundColor: `${color.darkBackground}65` }} />)
       })} />
    </Stack.Navigator>
  );
}

const HotStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        ...TransitionPresets.ModalPresentationIOS,
        headerMode: 'float',
        gestureEnabled: true,
        ...stackStyles,
        headerBackImage: (tintColor) => (<IonIcon name='ios-arrow-back' color={color.accent} size={40} />) }}>
      <Stack.Screen
        name="Hot"
        component={Hot}
        options={({ navigation, route }) => ({
          title: 'Hot',
          headerLeft: () => <HeaderDrawerButton navigation={navigation} /> })} />
      <Stack.Screen
        name="ImageViewHot"
        component={ImageView}
        options={({ route }) => ({
         title: '',
         headerTransparent: true,
         headerBackground: () => (<View style={{ width: '100%', height: '100%', backgroundColor: `${color.darkBackground}65` }} />)
       })} />
    </Stack.Navigator>
  );
}

const RandomStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        ...TransitionPresets.ModalPresentationIOS,
        headerMode: 'float',
        gestureEnabled: true,
        ...stackStyles,
        headerBackImage: (tintColor) => (<IonIcon name='ios-arrow-back' color={color.accent} size={40} />) }}>
      <Stack.Screen
        name="Random"
        component={Random}
        options={({ navigation, route }) => ({
          title: 'Random',
          headerLeft: () => <HeaderDrawerButton navigation={navigation} /> })} />
    </Stack.Navigator>
  );
}

const TabNav = () => {
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => { console.log('back pressed tabs'); return true; });
    return () => backHandler.remove();
  }, []);

  return (
    <Tab.Navigator
      initialRouteName="Categories"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          switch (route.name) {
            case 'CategoryStack': return <MCIcons name='view-list' size={size} color={color} />;
            case 'HotStack': return <MCIcons name='fire' size={size} color={color} />;
            case 'RandomStack': return <MCIcons name='shuffle-variant' size={size} color={color} />;
            default: return null;
          }
        },
      })}
      tabBarOptions={{
        activeTintColor: color.accent,
        inactiveTintColor: '#fff',
        style: {
          backgroundColor: color.darkBackground,
          elevation: 0,
          height: 60
         }
      }}
    >
      <Tab.Screen name="CategoryStack" component={CategoryStack} options={{ title: 'Categories' }} />
      <Tab.Screen name="HotStack" component={HotStack} options={{ title: 'Hot' }} />
      <Tab.Screen name="RandomStack" component={RandomStack} options={{ title: 'Random' }} />
    </Tab.Navigator>
  );
};
const labelStyle = { color: '#FFF' };
function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Rate This App"
        labelStyle={labelStyle}
        onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.dave6.wallpapergrid')}
      />
      <DrawerItem
        label="More Apps"
        labelStyle={labelStyle}
        onPress={() => Linking.openURL('https://play.google.com/store/search?q=pub%3ADave6&c=apps')}
      />
      <DrawerItem
        label="Developers Website"
        labelStyle={labelStyle}
        onPress={() => Linking.openURL('https://www.dave6.com')}
      />
    </DrawerContentScrollView>
  );
}
const DrawerNav = () => (
  <Drawer.Navigator
    drawerContent={(props) => <CustomDrawerContent {...props} />}
    drawerContentOptions={{
      activeTintColor: '#ffffff',
      activeBackgroundColor: color.accent+40,
      labelStyle
    }}
    drawerStyle={{
      width: 250,
      borderWidth: 1,
      backgroundColor: color.backgroundColor,
      borderColor: color.border,
      borderTopRightRadius: 20,
      borderBottomRightRadius: 20 }}>
    <Drawer.Screen name="home" component={TabNav} options={{ title: 'Home' }} />
  </Drawer.Navigator>
);

const Router = () => {
  return (
    <NavigationContainer>
      <DrawerNav />
    </NavigationContainer>
  );
}



export default Router;
