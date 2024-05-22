const currencies = require('./data/currencies.json')
const config = require('./data/config.json')
const conversions = require('./data/conversions.json')
const prompt = require('prompt-sync')()
const axios = require('axios')
const fsPromises = require('fs').promises
const path = require('path')
const { write } = require('fs')

const date = process.argv[2]

const checkAndEnd = (input) => {
    if (input.toUpperCase() === "END") {
        process.exit()
    }
}

const getCurrencyCode = () => {
    let currencyCode = prompt("Please enter currency code: ").toUpperCase()
    checkAndEnd(currencyCode)
    while (currencies.indexOf(currencyCode) === -1) {
        currencyCode = prompt("Please enter a valid currency code: ").toUpperCase()
        checkAndEnd(currencyCode)
    }
    return currencyCode
}

const writeConversion = async (conversion) => {
    conversions.push(conversion)
    await fsPromises.writeFile(path.join(__dirname, "data", "conversions.json"), JSON.stringify(conversions))
}

const main = async () => {
    while (true) {
        let amount = prompt("Please enter amount: ")
        let amountNum = Number(amount)
        checkAndEnd(amount)

        while (isNaN(amountNum) || amountNum <= 0
            || (amount.split(".").length == 2 && amount.split(".")[1].length > 2)) {
            amount = prompt("Please enter a valid amount?")
            amountNum = Number(amount)
            checkAndEnd(amount)
        }

        const baseCurrency = getCurrencyCode()
        const targetCurrency = getCurrencyCode()

        const prevConversion = conversions.find(c => c.base === baseCurrency && c.result[targetCurrency])

        if (prevConversion) {
            const result = Math.round(amount * prevConversion.result.rate * 100) / 100
            await writeConversion({
                base: prevConversion.base,
                amount,
                result: {
                    [targetCurrency]: result,
                    rate: prevConversion.result.rate
                }
            })
            console.log(`${amount} ${baseCurrency} is ${result} ${targetCurrency}`)
        } else {
            try {
                const res = await axios.get(`https://api.fastforex.io/convert?api_key=${config.api_key}&from=${baseCurrency}&to=${targetCurrency}&amount=${amount}`)
                await writeConversion(res.data)
                console.log(`${amount} ${baseCurrency} is ${res.data.result[targetCurrency]} ${targetCurrency}`)
            } catch (err) {
                console.log(err)
            }
        }
    }
}

main()

