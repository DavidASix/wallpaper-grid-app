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
  AdMobBanner,
  AdMobInterstitial,
  PublisherBanner,
  AdMobRewarded,
} from 'react-native-admob'
import axios from 'axios';

const c = require('../assets/constants');
const uf = require('../assets/uf');
const color = c.colors;

class ImageList extends Component {
  constructor(props) {
    super(props);
    this.initialState = {
      categoryId: false,
      images: [],
      loading: true,
      page: 1
    };
    this.state = this.initialState;
  }

  async componentDidMount() {
    try {
      let { data } = await axios.post(`${c.urls.api}getCategoryImages`, { categoryId: this.props.route.params.categoryId });
      let rowData = []
      for (let i = 0; i < Math.ceil(data.length); i = i+2) {
        let row = [data[i]];
        if (data[i + 1]) row.push(data[i+1]);
        rowData.push(row);
        // False items in list are rendered as ads
        if (i % 6 === 0 && i) rowData.push(false);
      }
      console.log(data.length);
      console.log(rowData.length);

      this.setState({
        images: rowData,
        categoryId: this.props.route.params.categoryId
      });
    } catch (err) {
      this.setState({ images: false });
    } finally {
      this.setState({ loading: false });
    }
  }

  componentWillUnmount() {
    this.setState(this.initialState);
  }

  renderImageRow(row, i) {
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
              onPress={() => this.props.navigation.navigate('ImageViewCategory', { image }) }
              style={[styles.rowImage, { backgroundColor: image.color }]}>
              <ActivityIndicator size='large' color={color.accent} style={{ position: 'absolute' }} />
              <Image
                source={{ uri: `${c.urls.assets}images/${image.title}.${image.type}` }}
                resizeMode='cover'
                style={{ width: '100%', height: '100%' }} />
              <View style={{
                position: 'absolute',
                justifyContent: 'space-around',
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
          keyExtractor={(item, index) => (index+'ITEM')}
          removeClippedSubviews={true}
          onEndThreshold={2.5}
          onEndReached={() => { if (images.length > page * 10) this.setState({ page: page + 1 }); }}
          showsVerticalScrollIndicator={false} />
      </>
    )
  }

  render() {
    let { theme } = this.props;
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
  }
};

export default ImageList;
