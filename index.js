#!/usr/bin/env node
const { PDFDocument, StandardFonts} = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const open = require('open');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
const express = require('express')
var path = require('path');

var appDir = path.dirname(require.main.filename);


class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

const namePoint = new Point(153, 720);
const birthPoint = new Point(294, 720);
const milStartPoint = new Point(440, 720);
const companyPoint = new Point(230, 680);
const reasonPoint = new Point(147, 643);
const phonePoint = new Point(282, 643);
const durationPoint = new Point(455, 643);
const workPlacePoint = new Point(200, 603);
const workStartDatePoint = new Point(101, 534);
const workStartTimePoint = new Point(201, 542);
const workEndTimePoint = new Point(201, 515);
const workMemoPoint = new Point(316, 539);
const chairmanPoint = new Point(327, 100);
const writerPoint = new Point(327, 120);
const signYearPoint = new Point(410, 155);
const signMonthPoint = new Point(455, 155);
const signDatePoint = new Point(489, 155);
const signSignaturePoint = new Point(410, 95);

class UserInfo {
  constructor(name, birth, milStartDate, phoneNumber, workPlace, companyName, chairmanName, reason) {
    this.name = name;
    this.birth = birth;
    this.milStartDate = milStartDate;
    this.phoneNumber = phoneNumber;
    this.workPlace = workPlace;
    this.companyName = companyName;
    this.chairmanName = chairmanName;
    this.reason = reason;
  }
}

class WorkInfo {
  constructor(date, workMemo, workStartTime = "10:00", workEndTime="19:00") {
    this.date = date;
    this.workMemo = workMemo;
    this.workStartTime = workStartTime;
    this.workEndTime = workEndTime;
  }
}

class WorkInfos {
  constructor(startDate, endDate, workInfoList) {
    this.startDate = startDate;
    this.endDate = endDate;
    this.workInfoList = workInfoList;
  }
}

const DefaultPdfTemplatePath = appDir +  "/assets/work.pdf"
const pdfTemplate = fs.readFileSync(appDir + "/assets/work.pdf")
const fontFile = fs.readFileSync(appDir + "/assets/NanumBarunGothic.otf")

async function drawUserSignature(page, signature, adjustX, adjustY) {
  const scale = signature.scale(0.2);
  page.drawImage(signature, {
    x: signSignaturePoint.x + adjustX, // firstPage.getWidth() / 2 - 150,
    y: signSignaturePoint.y + adjustY, //  - pngDims.height,
    width: scale.width,
    height: scale.height,
  })
  return page
}

async function drawUserInfo(page, userInfo, adjustX, adjustY) {
  var fontSize = 10
  page.drawText(userInfo.name, {
    x: namePoint.x + adjustX,
    y: namePoint.y - fontSize + adjustY,
    size: fontSize,
  })
  page.drawText(userInfo.name, {
    x: writerPoint.x + adjustX,
    y: writerPoint.y - fontSize + adjustY,
    size: fontSize,
  })
  page.drawText(userInfo.companyName, {
    x: companyPoint.x + adjustX,
    y: companyPoint.y - fontSize + adjustY,
    size: fontSize,
  })
  page.drawText(userInfo.birth, {
    x: birthPoint.x + adjustX,
    y: birthPoint.y - fontSize + adjustY,
    size: fontSize,
  })
  page.drawText(userInfo.milStartDate, {
    x: milStartPoint.x + adjustX,
    y: milStartPoint.y - fontSize + adjustY,
    size: fontSize,
  })
  page.drawText(userInfo.phoneNumber, {
    x: phonePoint.x + adjustX,
    y: phonePoint.y - fontSize + adjustY,
    size: fontSize,
  })
  page.drawText(userInfo.workPlace, {
    x: workPlacePoint.x + adjustX,
    y: workPlacePoint.y - fontSize + adjustY,
    size: fontSize,
  })
  page.drawText(userInfo.chairmanName, {
    x: chairmanPoint.x + adjustX,
    y: chairmanPoint.y - fontSize + adjustY,
    size: fontSize,
  })
  fontSize = 8
  page.drawText(userInfo.reason, {
    x: reasonPoint.x + adjustX,
    y: reasonPoint.y - fontSize + adjustY,
    size: fontSize,
  })
  return page;
}

async function createSheet(pdfTemplatePath, fileName, userInfo, workInfos, year, imgData, adjustX, adjustY) {
  const pdfDoc = await PDFDocument.load(fs.readFileSync(pdfTemplatePath))

  pdfDoc.registerFontkit(fontkit);
  const font = await pdfDoc.embedFont(fontFile)
  const signature = await pdfDoc.embedPng(imgData)

  var page = pdfDoc.getPage(0)
  page.setFont(font);

  page = await drawUserSignature(page, signature, adjustX, adjustY);
  page = await drawUserInfo(page, userInfo, adjustX, adjustY);

  const workInfoLen = workInfos.workInfoList.length
  const workDuration = workInfos.workInfoList[0].date + "~" + workInfos.workInfoList[workInfoLen-1].date
  console.log("Generating " + workDuration + " pdf result")

  var fontSize = 8
  page.drawText(workDuration, {
    x: durationPoint.x + adjustX,
    y: durationPoint.y - fontSize + adjustY,
    size: fontSize,
  })

  const splited = workInfos.workInfoList[workInfoLen-1].date.split('/')
  page.drawText(year, {
    x: signYearPoint.x + adjustX,
    y: signYearPoint.y - fontSize + adjustY,
    size: fontSize,
  })
  page.drawText(splited[0], {
    x: signMonthPoint.x + adjustX,
    y: signMonthPoint.y - fontSize + adjustY,
    size: fontSize,
  })
  page.drawText(splited[1], {
    x: signDatePoint.x + adjustX,
    y: signDatePoint.y - fontSize + adjustY,
    size: fontSize,
  })

  for (var i = 0; i < workInfos.workInfoList.length; i++) {
    fontSize = 8
    const height = 63
    var workInfo = workInfos.workInfoList[i]
    page.drawText(workInfo.date, {
      x: workStartDatePoint.x + adjustX,
      y: workStartDatePoint.y - fontSize - height*i + adjustY,
      size: fontSize,
    })
    page.drawText(workInfo.workMemo, {
      x: workMemoPoint.x + adjustX,
      y: workMemoPoint.y - fontSize - height*i + adjustY,
      size: fontSize,
    })

    fontSize = 6
    page.drawText(workInfo.workStartTime, {
      x: workStartTimePoint.x + adjustX,
      y: workStartTimePoint.y - fontSize - height*i + adjustY,
      size: fontSize,
    })
    page.drawText(workInfo.workEndTime, {
      x: workEndTimePoint.x + adjustX,
      y: workEndTimePoint.y - fontSize - height*i + adjustY,
      size: fontSize,
    })
  }
  fs.writeFileSync(fileName, await pdfDoc.save());
}

async function parseCSV(csvFileName) {
  const file = fs.readFileSync(csvFileName)
  records = parse(file.toString(), {columns: false, skip_empty_lines:false})
  const userInfo = new UserInfo(
    name=records[0][1],
    birth=records[1][1],
    milStartDate=records[2][1],
    phoneNumber=records[3][1],
    workPlace=records[4][1],
    companyName=records[5][1],
    chairmanName=records[6][1],
    reason=records[7][1],
  )
  var i = 0;
  var workInfos = [];
  for(i = 8; i < records.length; i+=5) {
    const workWindow = records.slice(i, i+5)
    var works = []
    for(var workIdx = 0; workIdx < workWindow.length; workIdx++) {
      var work = workWindow[workIdx]
      works.push(new WorkInfo(work[0], work[1]))
    }
    workInfos.push(
      new WorkInfos(
        startDate=workWindow[0][0],
        endDate=workWindow[workWindow.length-1][0],
        workInfoList=works
    ));
  }
  return [userInfo, workInfos]
}

const sleep = (ms) => {
   return new Promise(resolve=>{
       setTimeout(resolve,ms)
   })
}

async function getSignature() {
  const app = express()
  app.use(bodyParser.json()); // for parsing application/json
  app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
  app.use(upload.array()); // for parsing multipart/form-data
  app.use(express.static(appDir+'/public'))

  var data = ""

  app.post('/', (req, res) =>{
    res.send("Hello")
    data = req.body.imgData
  })

  const server = app.listen(8080, () => {
    console.log(`http://localhost:8080 에 접속해 서명부를 위한 싸인을 해주세요`)
  })
  open("http://127.0.0.1:8080/index.html")

  for(;;){
    if (data !== "") {
      break;
    }
    await sleep(1000)
  }

  server.close()
  return data
}

function parseArgv() {
  const argv = yargs(hideBin(process.argv))
    .option('csv', {
      alias: 'c',
      type: 'string',
      description: 'file path of csv file',
      default: undefined
    })
    .option('year', {
      alias: 'y',
      type: 'string',
      description: 'change year in document (default is current year)',
      default: new Date().getFullYear().toString()
    })
    .option('template', {
      alias: 't',
      type: 'string',
      description: 'set custom template of document',
      default: DefaultPdfTemplatePath
    })
    .option('dx', {
      type: 'number',
      number: true,
      description: 'custom template option to adjust cordinate',
      default: 0
    })
    .option('dy', {
      type: 'number',
      number: true,
      description: 'custom template option to adjust cordinate',
      default: 0
    })

  return argv;
}

async function main(){
  const signature = await getSignature()
  const myArgs = parseArgv()

  if (myArgs.argv.csv === undefined) {
    console.log("-c csv file path needed")
    myArgs.showHelp()
    process.exit(1)
  }

  const csvFileName = myArgs.argv.csv
  var year = myArgs.argv.year
  const [userInfo, workInfos] = await parseCSV(csvFileName);

  for (var i = 0; i < workInfos.length; i++) {
    var work = workInfos[i];
    const startDate = work.startDate.replace('/', '_')
    const endDate = work.endDate.replace('/', '_')
    const fileName = [userInfo.name, startDate, endDate].join('_') + ".pdf"
    await createSheet(myArgs.argv.template,"./"+fileName, userInfo, work, year, signature, myArgs.argv.dx * 1, myArgs.argv.dy * 1)
  }
}

main().then(()=>{
  console.log("success")
  process.exit(0)
})
