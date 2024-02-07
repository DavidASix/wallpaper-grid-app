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
import axios from 'axios';

const c = require('../assets/constants');
const color = c.colors;

class Categories extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      categories: [],
      refreshing: false
    };
  }

  async componentDidMount() {
    try {
      let { data } = await axios.get(`${c.urls.api}getCategories`);
      this.setState({ categories: data });
    } catch (err) {
      this.setState({ categories: [{ id: 0, slug: "error", title: "Network Error" }] });
    } finally {
      this.setState({ loading: false });
    }
  }


  onRefresh = async () => {
      try {
        this.setState({ refreshing: true })
        let { data } = await axios.get(`${c.urls.api}getCategories`);
        this.setState({ categories: data });
      } catch (err) {
        this.setState({ categories: [{ id: 0, slug: "error", title: "Network Error" }] });
      } finally {
        this.setState({ refreshing: false });
      }
  };


  renderCategory(category) {
    const shadow = {
      textShadowColor: 'rgba(10, 10, 10, 0.95)',
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 7
    };
    if (!category.id) {
      return (
        <View style={styles.category}>
          <Image
            source={require('../assets/warning.jpg')}
            resizeMode='cover'
            style={{ width: '100%', height: '100%' }} />
          <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: `#00000040` }} />
          <Text style={{ fontSize: 24, color: '#fff', position: 'absolute', ...shadow }}>
            {category.title}
          </Text>
        </View>
      );
    }
    return (
      <TouchableOpacity
        onPress={() => this.props.navigation.navigate('CategoryImageList', { categoryId: category.id, title: category.title }) }
        style={styles.category}>
        <Image
          source={{ uri: `${c.urls.assets}images/${category.coverImage.title}.${category.coverImage.type}` }}
          resizeMode='cover'
          style={{ width: '100%', height: '100%' }} />
        <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: `#00000040` }} />
        <Text style={{ fontSize: 24, color: '#fff', position: 'absolute', ...shadow }}>
          {category.title}
        </Text>
        <Text style={{ fontSize: 12, color: '#fff', position: 'absolute', bottom: 5, right: 5, ...shadow }}>
          {category.count} images
        </Text>
      </TouchableOpacity>
    );
  }

  renderLoadingSwitch() {
    if (this.state.loading) return <ActivityIndicator size='large' color={color.accent} />;
    return (
      <>
        <FlatList
          style={{ width: '100%', paddingVertical: 5, flex: 1 }}
          data={this.state.categories}
          keyExtractor={(item) => item.id + 'ITEM'}
          renderItem={({ item }) => this.renderCategory(item)}
          refreshing={this.state.refreshing}
          onRefresh={this.onRefresh}
        />
      </>
    )
  }

  render() {
    return (
      <View style={[styles.container]}>
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
    backgroundColor: color.backgroundColor
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

export default Categories;
