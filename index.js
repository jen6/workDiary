#!/usr/bin/env node
const { PDFDocument, StandardFonts} = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const open = require('open');
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

const file = fs.readFileSync(appDir + "/assets/work.pdf")
const fontFile = fs.readFileSync(appDir + "/assets/NanumBarunGothic.otf")

async function drawUserSignature(page, signature) {
  const scale = signature.scale(0.2);
  page.drawImage(signature, {
    x: signSignaturePoint.x, // firstPage.getWidth() / 2 - 150,
    y: signSignaturePoint.y, //  - pngDims.height,
    width: scale.width,
    height: scale.height,
  })
  return page
}

async function drawUserInfo(page, userInfo) {
  var fontSize = 10
  page.drawText(userInfo.name, {
    x: namePoint.x,
    y: namePoint.y - fontSize,
    size: fontSize,
  })
  page.drawText(userInfo.name, {
    x: writerPoint.x,
    y: writerPoint.y - fontSize,
    size: fontSize,
  })
  page.drawText(userInfo.companyName, {
    x: companyPoint.x,
    y: companyPoint.y - fontSize,
    size: fontSize,
  })
  page.drawText(userInfo.birth, {
    x: birthPoint.x,
    y: birthPoint.y - fontSize,
    size: fontSize,
  })
  page.drawText(userInfo.milStartDate, {
    x: milStartPoint.x,
    y: milStartPoint.y - fontSize,
    size: fontSize,
  })
  page.drawText(userInfo.phoneNumber, {
    x: phonePoint.x,
    y: phonePoint.y - fontSize,
    size: fontSize,
  })
  page.drawText(userInfo.workPlace, {
    x: workPlacePoint.x,
    y: workPlacePoint.y - fontSize,
    size: fontSize,
  })
  page.drawText(userInfo.chairmanName, {
    x: chairmanPoint.x,
    y: chairmanPoint.y - fontSize,
    size: fontSize,
  })
  fontSize = 8
  page.drawText(userInfo.reason, {
    x: reasonPoint.x,
    y: reasonPoint.y - fontSize,
    size: fontSize,
  })
  return page;
}

async function createSheet(fileName, userInfo, workInfos, year, imgData) {
  const pdfDoc = await PDFDocument.load(file)

  pdfDoc.registerFontkit(fontkit);
  const font = await pdfDoc.embedFont(fontFile)
  const signature = await pdfDoc.embedPng(imgData)

  var page = pdfDoc.getPage(0)
  page.setFont(font);

  page = await drawUserSignature(page, signature);
  page = await drawUserInfo(page, userInfo);

  const workInfoLen = workInfos.workInfoList.length
  const workDuration = workInfos.workInfoList[0].date + "~" + workInfos.workInfoList[workInfoLen-1].date
  console.log("Generating " + workDuration + " pdf result")

  var fontSize = 8
  page.drawText(workDuration, {
    x: durationPoint.x,
    y: durationPoint.y - fontSize,
    size: fontSize,
  })

  const splited = workInfos.workInfoList[workInfoLen-1].date.split('/')
  page.drawText(year, {
    x: signYearPoint.x,
    y: signYearPoint.y - fontSize,
    size: fontSize,
  })
  page.drawText(splited[0], {
    x: signMonthPoint.x,
    y: signMonthPoint.y - fontSize,
    size: fontSize,
  })
  page.drawText(splited[1], {
    x: signDatePoint.x,
    y: signDatePoint.y - fontSize,
    size: fontSize,
  })

  for (var i = 0; i < workInfos.workInfoList.length; i++) {
    fontSize = 8
    const height = 63
    var workInfo = workInfos.workInfoList[i]
    page.drawText(workInfo.date, {
      x: workStartDatePoint.x,
      y: workStartDatePoint.y - fontSize - height*i,
      size: fontSize,
    })
    page.drawText(workInfo.workMemo, {
      x: workMemoPoint.x,
      y: workMemoPoint.y - fontSize - height*i,
      size: fontSize,
    })

    fontSize = 6
    page.drawText(workInfo.workStartTime, {
      x: workStartTimePoint.x,
      y: workStartTimePoint.y - fontSize - height*i,
      size: fontSize,
    })
    page.drawText(workInfo.workEndTime, {
      x: workEndTimePoint.x,
      y: workEndTimePoint.y - fontSize - height*i,
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

async function main(){
  const signature = await getSignature()
  var myArgs = process.argv.slice(2);
  if (myArgs.length == 0) {
    console.log("Usage : workDiary 'csv file path' '[year]'")
    console.log("Example : workDiary ./sheet.csv 2020")
  }
  const csvFileName = myArgs[0]
  var year = myArgs[1]
  if (typeof year === "undefined") {
    year = new Date().getFullYear().toString();
  }
  const [userInfo, workInfos] = await parseCSV(csvFileName);

  for (var i = 0; i < workInfos.length; i++) {
    var work = workInfos[i];
    const startDate = work.startDate.replace('/', '_')
    const endDate = work.endDate.replace('/', '_')
    const fileName = [userInfo.name, startDate, endDate].join('_') + ".pdf"
    await createSheet("./"+fileName, userInfo, work, year, signature)
  }
}

main().then(()=>{console.log("success")})
