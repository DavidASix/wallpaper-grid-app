import React, { Component } from 'react';
import {
  View,
  Text,
  Image,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Share,
  Alert,
  ToastAndroid,
  PermissionsAndroid
} from 'react-native';
import axios from 'axios';
import RNFetchBlob from 'rn-fetch-blob';
import { AdMobBanner, AdMobInterstitial } from 'react-native-admob'
import WallPaperManager from '@ajaybhatia/react-native-wallpaper-manager';
import AntIcon from 'react-native-vector-icons/AntDesign';
import IonIcon from 'react-native-vector-icons/Ionicons';
import FontIcon from 'react-native-vector-icons/Fontisto';

const c = require('../assets/constants');
const uf = require('../assets/uf');
const color = c.colors;

function wait(timeout) {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
}


class Random extends Component {
  constructor(props) {
    super(props);
    this.state = {
      image: false,
      loading: true,
      refreshing: false
    };
  }

  async componentDidMount() {
    try {
      let { data } = await axios.get(`${c.urls.api}getRandomImage`);
      this.setState({ image: data });
      try {
        // Load intersitial ads
        AdMobInterstitial.setAdUnitID(c.ads.saveOrSet);
        AdMobInterstitial.setTestDevices([AdMobInterstitial.simulatorId]);
        await AdMobInterstitial.requestAd();
      } catch (err) {
        console.log('Error interstital: ', err);
        // Unable to load ad, no matter. Ad will not show;
      }
    } catch (err) {
      this.setState({ image: false });
    } finally {
      this.setState({ loading: false });
    }
  }

  onRefresh = async () => {
      try {
        this.setState({ refreshing: true })
        let { data } = await axios.get(`${c.urls.api}getRandomImage`);
        await axios.post(`${c.urls.api}incrementImageViews`, { imageId: data.id });
        this.setState({ image: data });
      } catch (err) {
        this.setState({ image: false });
      } finally {
        this.setState({ refreshing: false });
      }
  };

  async showInterstitial()  {
    try {
      console.log('getting ad');
      await AdMobInterstitial.requestAd();
    } catch (err) {
      console.log('Error getting ad', err);
      // Unable to get add from server, showAd will fail and nott display
    } finally {
      AdMobInterstitial.showAd();
    }
  }

    setWallpaper(uri, screen = 'home') {
      const validScreens = ['home', 'lock', 'both'];
      return new Promise(async (resolve, reject) => {
        if (!validScreens.find(i => i === screen)) reject('Invalid Screen Type');
        WallPaperManager.setWallpaper(
          { uri, screen },
          (res) => {
            this.setState({ loading: false });
            if (res.status !== 'success') {
              ToastAndroid.show('Failed to set wallpaper', ToastAndroid.SHORT);
              reject(res.msg);
            } else {
              try {
                ToastAndroid.show('Wallpaper set!', ToastAndroid.SHORT);
                this.showInterstitial();
              } catch (err) {
                console.log(err);
                // No errors
              } finally {
                resolve(res.msg);
              }
            }
        });
      });
    }

    onPressSet = () => {
      let { image } = this.state;
      let uri = `${c.urls.assets}images/${image.title}.${image.type}`;
      this.setState({ loading: 'set' });
      Alert.alert(
        'Set new wallpaper',
        'Which screen would you like to set?',
        [
          { text: 'Both', onPress: async () => await this.setWallpaper(uri, 'both') },
          { text: 'Home', onPress: async () => await this.setWallpaper(uri) },
          { text: 'Lock', onPress: async () => await this.setWallpaper(uri, 'lock') },
        ]
      )
    }

    onPressSave = async () => {
      let { image } = this.state;
      let uri = `${c.urls.assets}images/${image.title}.${image.type}`;
      this.setState({ loading: 'save' });
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          { title: 'Grant permission to save this wallpaper', message: 'WallPaper App needs access to your storage to download Photos.' });
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) throw 'No Permision';
        const { config, fs } = RNFetchBlob;
        let imageDir = RNFetchBlob.fs.dirs.PictureDir
        let options = {
          fileCache: true,
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            path: `${imageDir}/wallpaper_${image.title}_${Math.floor(Date.now())}.${image.type}`,
            description: 'Sweet Wallpaper'
          }
        }
        RNFetchBlob.config(options).fetch('GET', uri).then((res) => {
          ToastAndroid.show('Wallpaper Saved!', ToastAndroid.SHORT);
        });
      } catch (err) {
        ToastAndroid.show('Failed to save wallpaper', ToastAndroid.SHORT);
      } finally {
        this.setState({ loading: false });
        this.showInterstitial();
      }
    }

    renderHud() {
      let iconColor = '#FFFFFF';
      let { image } = this.state;

      return (
        <View style={styles.hudContainer}>
          <View style={styles.row}>
            <TouchableOpacity
              onPress={this.onPressSave}
              style={styles.rowButton}>
              {
                this.state.loading === 'save' ?
                <ActivityIndicator size='large' color={color.accent} /> :
                <>
                  <AntIcon name='download' color={iconColor} size={25} />
                  <Text style={[styles.buttonText, { color: iconColor}]}>
                    Save
                  </Text>
                </>
              }
            </TouchableOpacity>
            <TouchableOpacity
              onPress={this.onPressSet}
              style={styles.rowButton}>
              {
                this.state.loading === 'set' ?
                <ActivityIndicator size='large' color={color.accent} /> :
                <>
                  <IonIcon name='ios-images' color={iconColor} size={25} />
                  <Text style={[styles.buttonText, { color: iconColor}]}>
                    Set as
                  </Text>
                </>
              }
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => await Share.share({ message: `${c.urls.assets}images/${image.title}.${image.type} | Checkout more wallpapers here: https://dave6.com/android` })}
              style={styles.rowButton}>
              <IonIcon name='md-share' color={iconColor} size={25} />
              <Text style={[styles.buttonText, { color: iconColor}]}>
                Share
              </Text>
            </TouchableOpacity>
          </View>


          <View style={[styles.row]}>
            <View style={styles.rowDataContainer}>
              <IonIcon name='md-resize' color={iconColor} size={20} />
              <Text style={[styles.dataText, { color: iconColor}]}>
                {image.height}x{image.width}
              </Text>
            </View>
            <View style={styles.rowDataContainer}>
              <AntIcon name='file1' color={iconColor} size={20} />
              <Text style={[styles.dataText, { color: iconColor}]}>
                {image.mime}
              </Text>
            </View>
            <View style={styles.rowDataContainer}>
              <IonIcon name='ios-color-palette' color={iconColor} size={20} />
              <Text style={[styles.dataText, { color: iconColor}]}>
                {image.color}
              </Text>
            </View>
          </View>

          <View style={[styles.row]}>
            <View style={styles.rowDataContainer}>
              <AntIcon name='download' color={iconColor} size={20} />
              <Text style={[styles.dataText, { color: iconColor}]}>
                {uf.formatCount(image.downloads)} saves
              </Text>
              </View>
            <View style={styles.rowDataContainer}>
              <IonIcon name='ios-images' color={iconColor} size={20} />
              <Text style={[styles.dataText, { color: iconColor}]}>
                {uf.formatCount(image.sets)} sets
              </Text>
            </View>
            <View style={styles.rowDataContainer}>
              <FontIcon name='preview' color={iconColor} size={20} />
              <Text style={[styles.dataText, { color: iconColor}]}>
                {uf.formatCount(image.views)} views
              </Text>
            </View>
            <View style={styles.rowDataContainer}>
              <IonIcon name='md-time' color={iconColor} size={20} />
              <Text style={[styles.dataText, { color: iconColor}]}>
                {uf.timeSince(this.state.image.created)}
              </Text>
            </View>
          </View>

        </View>
      );
    }

  renderNetworkErrorSwitch() {
    let { image, layout } = this.state;
    const shadow = {
      textShadowColor: 'rgba(10, 10, 10, 0.95)',
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 7
    };
    if (!image) {
      return (
        <View style={styles.category}>
          <Image
            source={require('../assets/warning.jpg')}
            resizeMode='cover'
            style={{ width: '100%', height: '100%' }} />
          <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: `#00000040` }} />
          <Text style={{ fontSize: 24, color: '#fff', position: 'absolute', ...shadow }}>
            Network Error
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.imageContainer, { height: layout.height, width: layout.width }]}>
        <Image
          source={{ uri: `${c.urls.assets}images/${image.title}.${image.type}` }}
          style={styles.image} />
        {this.renderHud()}
      </View>
    )
  }

  renderLoadingSwitch() {
    let { loading, image, refreshing, layout } = this.state;
    if (loading === true) return <ActivityIndicator size='large' color={color.accent} />;
    if (!layout) return null;
    return (
      <>
        <ScrollView
          style={{ height: '100%', width: '100%' }}
          scrollEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={this.onRefresh} />} >
            {this.renderNetworkErrorSwitch()}
        </ScrollView>
      </>
    );
  }

  render() {
    let { theme } = this.props;
    return (
      <View
        style={[styles.container, { backgroundColor: color.backgroundColor }]}
        onLayout={({ nativeEvent }) => this.setState({ layout: nativeEvent.layout })}>
        {this.renderLoadingSwitch()}
      </View>

    );
  }
}

const styles = {
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  imageContainer: {
    alignSelf: 'center',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  image: {
    height: '99%',
    width: '98%',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5
  },
  hudContainer: {
    position: 'absolute',
    padding: 2.5,
    bottom: 0,
    width: '80%',
    flex: 0,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    alignItems: 'center',
    backgroundColor: `${color.accent}80`
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    flex: 0,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  rowButton: {
    height: 60,
    flex: 1,
    margin: 2.5,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${color.darkBackground}95`
  },
  buttonText: {
    fontSize: 12,
    marginTop: 5
  },
  rowDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: `${color.darkBackground}90`,
    padding: 5,
    margin: 2.5,
    flex: 1,
    borderRadius: 5
  },
  dataText: {
    fontSize: 10,
    marginHorizontal: 3
  },
  category: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    width: '98%',
    height: 200,
    marginVertical: 5,
    borderRadius: 6,
    borderColor: color.border,
    overflow: 'hidden',
    borderWidth: 1
  }
};

export default Random;
