import React, { Component } from 'react';
import {
  View,
  Text,
  Image,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList
} from 'react-native';
import {
  AdMobBanner
} from 'react-native-admob'
import axios from 'axios';

const c = require('../assets/constants');
const uf = require('../assets/uf');
const color = c.colors;

class Hot extends Component {
  constructor(props) {
    super(props);
    this.initialState = {
      categoryId: false,
      images: [],
      loading: true,
      page: 1,
      refreshing: false
    };
    this.state = this.initialState;
  }

  async componentDidMount() {
    try {
      let { data } = await axios.get(`${c.urls.api}getHotImages`);
      let rowData = []
      for (let i = 0; i < Math.ceil(data.length); i = i+2) {
        let row = [data[i]];
        if (data[i + 1]) row.push(data[i+1]);
        rowData.push(row);
        // False items in list are rendered as ads
        if (i % 6 === 0 && i) rowData.push(false);
      }
      this.setState({ images: rowData });
    } catch (err) {
      this.setState({ images: ['networkError'] });
    } finally {
      this.setState({ loading: false });
    }
  }

  componentWillUnmount() {
    this.setState(this.initialState);
  }

  onRefresh = async () => {
      try {
        this.setState({ refreshing: true })
        let { data } = await axios.get(`${c.urls.api}getHotImages`);
        let rowData = []
        for (let i = 0; i < Math.ceil(data.length); i = i+2) {
          let row = [data[i]];
          if (data[i + 1]) row.push(data[i+1]);
          rowData.push(row);
          // False items in list are rendered as ads
          if (i % 6 === 0 && i) rowData.push(false);
        }
        this.setState({ images: rowData });
      } catch (err) {
        this.setState({ images: ['networkError'] });
      } finally {
        this.setState({ refreshing: false });
      }
  };

    renderImageRow(row, i) {
      const shadow = {
        textShadowColor: 'rgba(10, 10, 10, 0.95)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 7
      };
      if (row === 'networkError') {
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
      if (!row) {
        return (
          <View style={styles.row}>
            <View
              key={i}
              style={[styles.rowImage, { backgroundColor: color.darkBackground, width: '98%' }]}>
                <Image
                  source={require('../assets/icon.png')}
                  style={[styles.rowImage, { borderRadius: 40, width: '65%', height: 250, position: 'absolute' }]} />
              <AdMobBanner
                adSize="mediumRectangle"
                adUnitID={c.ads.listBanner}
                onAdFailedToLoad={error => console.log('Cat Banner, ',new Date(Date.now()), ': ', error)} />
            </View>
          </View>
        );
      }

      return (
        <View style={styles.row}>
          {
            row.map((image, j) => (
              <TouchableOpacity
                key={image.title}
                onPress={() => this.props.navigation.navigate('ImageViewHot', { image }) }
                style={[styles.rowImage, { backgroundColor: image.color }]}>
                <ActivityIndicator size='large' color={color.accent} style={{ position: 'absolute' }} />
                <Image
                  source={{ uri: `${c.urls.assets}images/${image.title}.${image.type}` }}
                  resizeMode='cover'
                  style={{ width: '100%', height: '100%' }} />
                <View style={{
                  position: 'absolute',
                  justifyContent: 'flex-start',
                  bottom: 0,
                  width: '100%',
                  height: 70,
                  backgroundColor: image.color + '98'

                }}>
                  <Text style={{ fontSize: 16, color: 'white' }}>
                    {uf.formatBytes(image.bytes)}
                  </Text>
                  <Text style={{ fontSize: 16, color: 'white' }}>
                    {uf.timeSince(image.created)} ago
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          }
        </View>
      );
    }

    renderLoadingSwitch() {
      let { page, images } = this.state;
      if (this.state.loading) return <ActivityIndicator size='large' color={color.accent} />;
      if (!this.state.images) return null;
      // https://reactnative.dev/docs/optimizing-flatlist-configuration
      // Optimized List
      return (
        <>
          <FlatList
            data={this.state.images.slice(0, 10 * page)}
            renderItem={({ item, index }) => this.renderImageRow(item, index)}
            style={{ width: '100%', height: '100%' }}
            updateCellsBatchingPeriod={100}
            windowSize={11}
            getItemLayout={(data, index) => ({ length: 305, offset: 305 * index, index })}
            keyExtractor={(item, index) => (index + 'ITEM')}
            removeClippedSubviews={true}
            onEndThreshold={2.5}
            onEndReached={() => { if (images.length > page * 10) this.setState({ page: page + 1 }); }}
            onRefresh={this.onRefresh}
            refreshing={this.state.refreshing}
            showsVerticalScrollIndicator={false} />
        </>
      )
    }

    render() {
      return (
        <View style={[styles.container, { backgroundColor: color.backgroundColor }]}>
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
  row: {
     height: 300,
     marginVertical: 2.5,
     flexDirection: 'row',
     justifyContent: 'space-around'
  },
  rowImage: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    width: '48%',
    height: 300,
    borderRadius: 5,
    borderColor: color.border,
    overflow: 'hidden',
    borderWidth: 1
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
export default Hot;
