import { StyleSheet, Text, SafeAreaView } from 'react-native'
import React from 'react'
import ProfileForm from '../components/ProfileForm'

const ProfileView = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ProfileForm />
    </SafeAreaView>
  )
}

export default ProfileView

const styles = StyleSheet.create({})
