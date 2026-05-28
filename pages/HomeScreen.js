import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Button,
  ActivityIndicator
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function HomeScreen() {

  const navigation = useNavigation();

  const [permission, requestPermission] =
    useCameraPermissions();

  const [isScanning, setIsScanning] =
    useState(true);

  const [locationStatus, setLocationStatus] =
    useState('checking');

  const [distance, setDistance] =
    useState(0);

const KAMPUS_LAT = -6.3480;
const KAMPUS_LON = 107.1482;

  // TESTING RADIUS
  const MAKSIMAL_JARAK_METER = 250;

  const BASE_URL =
    'http://10.1.12.186:8080/api/presensi';

  useEffect(() => {

    if(permission?.granted){
      verifyLocation();
    }

  },[permission]);

  const calculateDistance = (
    lat1,
    lon1,
    lat2,
    lon2
  ) => {

    const R = 6371e3;

    const φ1 = lat1*Math.PI/180;
    const φ2 = lat2*Math.PI/180;

    const Δφ =
      (lat2-lat1)*Math.PI/180;

    const Δλ =
      (lon2-lon1)*Math.PI/180;

    const a =
      Math.sin(Δφ/2)**2 +
      Math.cos(φ1)*
      Math.cos(φ2)*
      Math.sin(Δλ/2)**2;

    const c =
      2*
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1-a)
      );

    return R*c;
  };

  const verifyLocation = async() => {

    setLocationStatus('checking');

    try{

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if(status!=='granted'){

        Alert.alert(
          'Akses Ditolak',
          'GPS wajib diaktifkan.'
        );

        setLocationStatus('error');
        return;
      }

      const currentLocation =
        await Location.getCurrentPositionAsync({
          accuracy:
            Location.Accuracy.BestForNavigation
        });

      const myLat =
        currentLocation.coords.latitude;

      const myLon =
        currentLocation.coords.longitude;

      console.log("MY LAT:",myLat);
      console.log("MY LON:",myLon);

      const jarakMeter =
        calculateDistance(
          myLat,
          myLon,
          KAMPUS_LAT,
          KAMPUS_LON
        );

      setDistance(
        Math.round(jarakMeter)
      );

      if(
        jarakMeter <=
        MAKSIMAL_JARAK_METER
      ){
        setLocationStatus('valid');
      }
      else{
        setLocationStatus('invalid');
      }

    }
    catch(error){

      console.log(error);

      Alert.alert(
        'GPS Error',
        'Gagal membaca lokasi.'
      );

      setLocationStatus('error');
    }
  };

  const handleBarCodeScanned =
    ({data}) => {

    if(!isScanning) return;

    setIsScanning(false);

    Alert.alert(
      'QR Terdeteksi',
      data,
      [
        {
          text:'OK',
          onPress:()=>
            setIsScanning(true)
        }
      ]
    );
  };

  if(!permission?.granted){

    return(

      <View style={styles.center}>

        <Text style={styles.text}>
          Kamera diperlukan
        </Text>

        <TouchableOpacity
          style={styles.btn}
          onPress={requestPermission}
        >

          <Text style={styles.btnText}>
            Izinkan Kamera
          </Text>

        </TouchableOpacity>

      </View>
    );
  }

  if(locationStatus==='checking'){

    return(

      <View style={styles.center}>

        <ActivityIndicator
          size="large"
          color="blue"
        />

        <Text style={styles.text}>
          Mengambil GPS...
        </Text>

      </View>
    );
  }

  if(locationStatus==='invalid'){

    return(

      <View style={styles.center}>

        <MaterialIcons
          name="block"
          size={80}
          color="red"
        />

        <Text style={styles.error}>
          Akses Ditolak
        </Text>

        <Text style={styles.text}>
          Jarak Anda:
          {distance} meter
        </Text>

        <Text style={styles.text}>
          Radius:
          {MAKSIMAL_JARAK_METER}m
        </Text>

        <TouchableOpacity
          style={styles.btn}
          onPress={verifyLocation}
        >

          <Text style={styles.btnText}>
            Refresh GPS
          </Text>

        </TouchableOpacity>

      </View>
    );
  }

  return(

    <View style={styles.container}>

      <CameraView
        style={
          StyleSheet.absoluteFillObject
        }
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes:['qr']
        }}
        onBarcodeScanned={
          isScanning
            ? handleBarCodeScanned
            : undefined
        }
      />

      <View style={styles.overlay}>

        <View style={styles.badge}>

          <MaterialIcons
            name="check-circle"
            color="white"
            size={24}
          />

          <Text style={styles.badgeText}>
            Lokasi Valid ({distance}m)
          </Text>

        </View>

        <Text style={styles.scanText}>
          Scan QR Dosen
        </Text>

        {!isScanning && (

          <Button
            title="Scan Lagi"
            onPress={() =>
              setIsScanning(true)
            }
          />

        )}

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:'black'
  },

  center:{
    flex:1,
    justifyContent:'center',
    alignItems:'center',
    padding:20
  },

  overlay:{
    flex:1,
    justifyContent:'space-between',
    padding:30,
    backgroundColor:
      'rgba(0,0,0,0.45)'
  },

  badge:{
    flexDirection:'row',
    alignItems:'center',
    backgroundColor:'green',
    padding:12,
    borderRadius:20
  },

  badgeText:{
    color:'white',
    marginLeft:8,
    fontWeight:'bold'
  },

  scanText:{
    color:'white',
    fontSize:22,
    fontWeight:'bold',
    textAlign:'center'
  },

  btn:{
    backgroundColor:'#A06035',
    padding:15,
    borderRadius:10,
    marginTop:20
  },

  btnText:{
    color:'white',
    fontWeight:'bold'
  },

  text:{
    marginTop:10,
    textAlign:'center'
  },

  error:{
    color:'red',
    fontSize:28,
    fontWeight:'bold',
    marginVertical:15
  }

});