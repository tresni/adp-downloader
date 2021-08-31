#! /usr/bin/env node

const path = require('path/posix');
const puppeteer = require('puppeteer-extra');
const fs = require('fs');

const nodeFetch = require('node-fetch');
const { exit } = require('process');
const fetch = nodeFetch;

puppeteer.use(
    require("puppeteer-extra-plugin-user-preferences")({
        userPrefs: {
            download: {
                prompt_for_download: false,
                open_pdf_in_system_reader: true,
            },
            plugins: {
                always_open_pdf_externally: true, // this should do the trick
            },
        },
    })
);

if (process.argv.length != 4) {
    console.log("Must supply username and password. Proper format is:");
    console.log(`node ${process.argv[1]} USERNAME PASSWORD`)
    exit(1);
}

(async() => {
    browser = await puppeteer.launch({ headless: false });
    let page = null
    try {
        result = await browser.newPage()
            .then((p) => {
                page = p
                return p._client.send('Page.setDownloadBehavior', {
                    behavior: 'allow',
                    downloadPath: path.resolve('./paystubs')
                })
            })
            .then(() =>
                page.goto('https://online.adp.com/olp/olplanding.html?APPID=PRWC', { waituntil: 'networkidle2' })
            )
            .then(() => page.waitForSelector("input#login-form_username"))
            .then((elem) => elem.type(process.argv[2]))
            .then(() => page.keyboard.press("Enter"))
            .then(() => page.waitForSelector("input#login-form_password"))
            .then((elem) => elem.type(process.argv[3]))
            .then(() => page.keyboard.press("Enter"))
            .then(() => page.waitForNavigation())
            .then(() => page.$('a[title]'))
            .then((elem) => {
                if (!elem) return page.goto('https://prwc.adp.com/iprwc/employee/payroll/summary.asp?selected_task=ViewPaychecks', { waituntil: 'networkidle2' });
                else {
                    browser.close()
                    browser = null
                    throw "Looks like we forgot to logout"
                }
            })

        while (true) {
            links = await page.$('td[colspan="8"]')
                .then((elem) => {
                    if (elem) return elem.evaluateHandle((elem) => elem.closest("table"))
                    else throw "Unable to find table"
                })
                .then((table) => table.$$("td:first-of-type"))
                .then((elems) => elems.slice(2))
                .catch((err) => console.log(err))

            for (link of links.values()) {
                a = await link.$('a')
                await a.click()
            }
            next = await page.$("input[value^='Next'][name='buttonaction']") //.then((elems) => elems.pop())
            if (!next) {
                break
            }
            await next.click().then(() => page.waitForNavigation())
        }
    } catch (e) {
        console.log(e)
        return 1
    }
    page.goto("https://prwc.adp.com/iprwc/employee/profile/survey.asp?selected_task=survey&logoff=yes")
        .finally(() => browser.close())
})();