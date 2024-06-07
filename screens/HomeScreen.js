import { View, Text, Image, SafeAreaView, TextInput, Touchable, TouchableOpacity, ScrollView } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { theme } from "../theme";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { CalendarDaysIcon, MagnifyingGlassIcon, MapPinIcon } from 'react-native-heroicons/outline'
import { debounce } from 'lodash'
import { fetchSearchLocations, fetchWeatherForecast, reverseGeocode } from "../api/weather";
import { hereApiKey, weatherImages } from "../constants";
import * as Progress from 'react-native-progress'
import { getData, storeData } from "../utils/async_storage";
import Geolocation from "@react-native-community/geolocation";

export default function HomeScreen() {
    const [showSeach, toggleSeach] = useState(true)
    const [locations, setLocations] = useState([])
    const [weather, setWeather] = useState({})
    const [loading, setLoading] = useState(true)

    const handleLocation = (location) => {
        setLocations([])
        toggleSeach(false)
        setLoading(true)
        fetchWeatherForecast({ cityName: location.name, days: '7' }).then((data) => {
            setWeather(data)
            setLoading(false)
            storeData('city', location.name)
        })
    }

    const handleSearch = name => {
        // fetch locations
        if (name.length > 2)
            fetchSearchLocations({ cityName: name }).then((data) => {
                setLocations(data)
            })
    }

    useEffect(() => {
        getCurrentForecast()
    }, [])

    function getAddressFromCoordinates(latitude, longitude) {
        return new Promise((resolve) => {
            const url = `https://reverse.geocoder.ls.hereapi.com/6.2/reversegeocode.json?apiKey=${hereApiKey}&mode=retrieveAddresses&prox=${latitude},${longitude}`
            fetch(url)
                .then(res => res.json())
                .then((resJson) => {
                    // the response had a deeply nested structure :/
                    console.log(resJson);
                    if (resJson
                        && resJson.Response
                        && resJson.Response.View
                        && resJson.Response.View[0]
                        && resJson.Response.View[0].Result
                        && resJson.Response.View[0].Result[0]) {
                        resolve(resJson.Response.View[0].Result[0].Location.Address.Label)
                    } else {
                        resolve()
                    }
                })
                .catch((e) => {
                    console.log('Error in getAddressFromCoordinates', e)
                    resolve()
                })
        })
    }


    const getCurrentForecast = async () => {
        // let myCity = await getData('city')
        let cityName = "";
        Geolocation.getCurrentPosition(async (position) => {
            let address = await reverseGeocode({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            })
            cityName = address.items[0].address.county
            fetchWeatherForecast({ cityName: cityName, days: '7' }).then((data) => {
                setWeather(data)
                setLoading(false)
            })
        })
        // if (myCity) cityName = myCity
    }

    const handleTextDebounce = useCallback(debounce(handleSearch, 1200), [])
    const { current, location } = weather

    return (
        <View className="flex-1 relative" style={{ backgroundColor: Colors.black }}>
            <Image opacity={70} source={require('../assets/images/bg.png')} className="absolute h-full w-full" />
            {
                !loading ? (
                    <SafeAreaView className="flex flex-1 mt-2">
                        <View style={{ height: '7%' }} className="mx-4 relative z-50">
                            <View className="flex-row justify-end items-center rounded-full"
                                style={{ backgroundColor: showSeach ? theme.bgWhite(0.2) : 'transparent' }}>
                                {
                                    showSeach ? (
                                        <TextInput
                                            placeholder="Search city" placeholderTextColor={'lightgray'}
                                            className="pl-6 h-10 flex-1 text-base text-white"
                                            onChangeText={handleTextDebounce} />
                                    ) : null
                                }
                                {/* <TextInput placeholder="Search city" placeholderTextColor={'lightgray'} className="pl-6 h-10 flex-1 text-base text-white" /> */}
                                <TouchableOpacity
                                    onPress={() => toggleSeach(!showSeach)}
                                    style={{ backgroundColor: theme.bgWhite(0.3) }}
                                    className="rounded-full p-3 m-1"
                                >
                                    <MagnifyingGlassIcon size={25} color="white" />
                                </TouchableOpacity>
                            </View>
                            {
                                locations.length > 0 && showSeach ? (
                                    <View className="absolute w-full bg-gray-300 top-16 rounded-3xl">
                                        {
                                            locations.map((location, index) => {
                                                let showBorder = index + 1 < locations.length
                                                let borderClass = showBorder ? 'border-b-2 border-b-gray-400' : ''
                                                return <TouchableOpacity key={index}
                                                    onPress={() => handleLocation(location)}
                                                    className={"flex-row items-center border-0 p-3 px-4 mb-1 " + borderClass}>
                                                    <MapPinIcon size={20} color={"gray"} />
                                                    <Text className="text-black text-lg ml-2">{location.name}, {location.country}</Text>
                                                </TouchableOpacity>
                                            })
                                        }
                                    </View>
                                ) : null
                            }
                        </View>
                        {/* forecast section */}
                        <View className="mx-4 flex justify-around flex-1 mb-2">
                            {/* location */}
                            <Text className="text-white text-center text-2xl font-bold">
                                {location?.name},
                                <Text className="text-lg font-semibold text-gray-300">
                                    {" " + location?.country}
                                </Text>
                            </Text>
                            {/* weather image */}
                            <View className="flex-row justify-center">
                                <Image source={weatherImages[current?.condition?.text]} className="w-52 h-52" />
                            </View>
                            {/* degree c */}
                            <View className="space-y-2">
                                <Text className="text-center font-bold text-white text-6xl ml-5">{current?.temp_c}&#176;</Text>
                                <Text className="text-center text-white text-xl tracking-widest">{current?.condition?.text}</Text>
                            </View>
                            {/* other stats */}
                            <View className="flex-row justify-between mx-4">
                                <View className="flex-row space-x-2 items-center">
                                    <Image source={require("../assets/icons/wind.png")} className="h-6 w-6" />
                                    <Text className="text-white font-semibold text-base">{current?.wind_kph}</Text>
                                </View>
                                <View className="flex-row space-x-2 items-center">
                                    <Image source={require("../assets/icons/drop.png")} className="h-6 w-6" />
                                    <Text className="text-white font-semibold text-base">{current?.humidity}%</Text>
                                </View>
                                <View className="flex-row space-x-2 items-center">
                                    <Image source={require("../assets/icons/sun.png")} className="h-6 w-6" />
                                    <Text className="text-white font-semibold text-base">{weather?.forecast?.forecastday[0]?.astro?.sunrise}</Text>
                                </View>
                            </View>
                        </View>
                        <View className="mb-2 space-y-3">
                            <View className="flex-row items-center mx-5 space-x-2">
                                <CalendarDaysIcon size={22} color={"white"} />
                                <Text className="text-white text-base">Daily forecast</Text>
                            </View>
                            <ScrollView horizontal
                                contentContainerStyle={{ paddingHorizontal: 15 }}
                                showsHorizontalScrollIndicator={false}>
                                {
                                    weather?.forecast?.forecastday?.map((forecast, index) => {
                                        let date = new Date(forecast.date)
                                        let options = { weekday: 'long' }
                                        let dayName = date.toLocaleDateString('en-US', options)
                                        return (
                                            <View key={index} style={{ backgroundColor: theme.bgWhite(0.15) }}
                                                className="flex justify-center items-center w-24 rounded-3xl py-3 space-y-1 mr-4">
                                                <Image source={weatherImages[forecast?.day?.condition?.text]} className="h-11 w-11" />
                                                <Text className="text-white">{dayName.split(',')[0]}</Text>
                                                <Text className="text-white text-xl font-semibold">{forecast?.day?.avgtemp_c}&#176;</Text>
                                            </View>
                                        )
                                    })
                                }
                            </ScrollView>
                        </View>
                    </SafeAreaView >
                ) : (
                    <View className="flex-1 flex-row justify-center items-center">
                        {/* <Text className="text-white text-4xl">Loading</Text> */}
                        <Progress.CircleSnail thickness={10} size={100} color={"orange"} />
                    </View>
                )
            }

        </View >
    )
}