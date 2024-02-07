import React, { PureComponent } from 'react';
import {
  View,
  Text,
  Image,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import EvilIcon from 'react-native-vector-icons/EvilIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';

import c from '../assets/constants';
const color = c.colors;

class Header extends PureComponent {

  drawerRoute() {
    let drawerRoutes = ['Categories', 'Hot', 'Random'];
    let { scene, previous, navigation } = this.props;
    return Boolean(drawerRoutes.find((route) => (route === scene.route.name)))
  }

  imageViewRoute() {
    let drawerRoutes = ['ImageViewHot', 'ImageViewCategory'];
    let { scene, previous, navigation } = this.props;
    return Boolean(drawerRoutes.find((route) => (route === scene.route.name)))
  }

  onLeftIconClick = () => {
    if (this.drawerRoute()) {
      navigation.toggleDrawer();
    } else {
      navigation.goBack();
    }
  }

  renderLeftIcon() {
    if (this.drawerRoute()) {
      return <EvilIcon name='navicon' color={color.accent} size={40} />;
    }
    return <IonIcon name='ios-arrow-back' color={color.accent} size={40} />;
  }

  render() {
    let { scene, previous, navigation } = this.props;
    console.log(scene.route);
    let position = !this.imageViewRoute() ? undefined : 'absolute';
    return (
      <View style={{
        justifyContent: 'center',
        alignItems: 'center',
        position,
    zIndex: 100,
    top: 0,
    left: 0,
    right: 0,
        width: '100%',
        height: 50,
        backgroundColor: color.accent + '75',
        borderColor: color.border
      }}>
        <TouchableOpacity
          onPress={this.onLeftIconClick}
          style={{ minWidth: 40, position: 'absolute', left: 10, zIndex: 999, elevation: 100 }}>
            {this.renderLeftIcon()}
        </TouchableOpacity>
        <Text style={{ color: 'white' }}>
          {scene.route.name}
        </Text>
      </View>
    );
  }
};

export default Header;
