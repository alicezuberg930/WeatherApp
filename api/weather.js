import axios from "axios";
import { apiKey, hereApiKey } from '../constants'

const forecastEndpoint = params => `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${params.cityName}&days=${params.days}&aqi=no&alerts=no`
const searchEndpoint = params => `https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${params.cityName}`
const reverseGeocoderEndpoint = params => `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${params.latitude}%2C${params.longitude}&lang=en-US&apiKey=${hereApiKey}`

const apiCall = async (endpoint) => {
    const options = { method: "GET", url: endpoint }
    try {
        const response = await axios.request(options)
        return response.data
    } catch (error) {
        console.log(error)
        return
    }
}

export const fetchWeatherForecast = (params) => {
    let forecastUrl = forecastEndpoint(params)
    return apiCall(forecastUrl)
}

export const fetchSearchLocations = (params) => {
    let searchUrl = searchEndpoint(params)
    return apiCall(searchUrl)
}

export const reverseGeocode = (params) => {
    let reverseGeocodeUrl = reverseGeocoderEndpoint(params)
    return apiCall(reverseGeocodeUrl)
}
