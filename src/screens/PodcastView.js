import { StyleSheet, Image, SafeAreaView, Text } from 'react-native'
import React from 'react'
import Header from '../components/smart_components/Header'

const PodcastView = () => {
  return (
    <SafeAreaView>
       <Header />
       <Image
        style={styles.imageLogo}
        source={{ uri: 'https://www.espacioseryhacer.com/wp-content/uploads/2024/02/1Mesa-de-trabajo-2-100.jpg' }}
    />
  <Text>PSILOCOGÍA PODCAST</Text>
    </SafeAreaView>
  )
}

export default PodcastView

const styles = StyleSheet.create({})