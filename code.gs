const token = '-----------------------------------------';
const userlistsheetID = '---------------------------------';
const reportfolderID = '-------------------------------';
const originalreportID = '---------------------------------';
const logsheetID = '--------------------------------------';
let userfolderurl
let userreporturl
const now = new Date();
now.setHours(now.getHours() -4);
const thismonth = now.getMonth() + 1;
const day = new Date();
day.setHours(day.getHours() - 4);
let yyyy = day.getFullYear();
let mm = day.getMonth() + 1;
let dd = day.getDate();
let dayOfWeek = day.getDay();
let canremove = false;
// デフォルト交通費が設定されている場合のフラッグです．勤務登録があった場合のみtrueになります
let isKoutuuhi = false;
let dayOfWeekStr = ['日','月','火','水','木','金','土'];

// パラメータ設定
const pricefield = 'C8';
const schoolfield = 'C45';
const namefield = 'C46';
const userIDfield = 'F45';
const jimu_block = [6,8,10,12,14];
let mes = '〈' + mm + '/' + dd + '（' + dayOfWeekStr[dayOfWeek] + '）〉\n';
let contents;
let altText;
let isAdmin = 0;

function doPost(e){
  let eventData = JSON.parse(e.postData.contents).events[0];
  //let replyToken = eventData.replyToken;
  let userID = eventData.source.userId;
  let eventType = eventData.type;
  let messageType = eventData.message.type;
  
  if(eventType == 'message'){
    if(messageType == 'text'){
      
      let userMessage = eventData.message.text;
      userMessage = userMessage.split(/\r\n|\n/);

      // 日付指定があった場合月・日（グローバル変数）を変更．userMessageをshift処理
      if(userMessage[0].includes('/')){
        if(userMessage.length == 1){
          mes = '【エラー】\n引数が不足しています！';
          pushReply(userID,mes);
          return;
        }
        [mm,dd] = userMessage[0].split('/');
        let spmm = mm - 1;
        if(mm != thismonth){
          mes = '【エラー】\n現在は' + thismonth + '月の報告を受け付けています！';
          pushReply(userID,mes);
          return;
        }
        var spdate = new Date(yyyy,spmm,dd);
        dayOfWeek = spdate.getDay();
        userMessage.shift();
        mes = '〈' + mm + '/' + dd + '（' + dayOfWeekStr[dayOfWeek] + '）〉\n';
      }

      // 数字登録があった場合
      if(!isNaN(userMessage[0])){
        // 報告書作業
        let num = Number(userMessage[0]);
        mes = regist_tuujou(userID,num);
        if(isKoutuuhi){
              mes = mes + '\n（交通費有）';
        }
        pushReply(userID,mes);
        userMessage[0] = "dummy";
      }

      // adminコマンドを強制実行する場合
      if(userMessage[0] == "!admin"){
        isAdmin++;
        userMessage.shift();
      }

      // 他のオプション
      switch(userMessage[0]){
        case "登録":
          if(userMessage.length == 3){
            let school = userMessage[1];
            let username = userMessage[2];
            mes = regist(userID,school,username);
          }else if(userMessage.length < 3){
            mes = '【エラー】\n登録のための引数が不足しています！\n登録をするには\n\n-----\n登録\n[校舎名]\n[氏名]\n-----\n\nと入力します';
            pushReply(userID,mes);
            break;
          }else if(userMessage.length > 3){
            mes = '【エラー】\n登録のための引数が多すぎます！\n登録をするには\n\n-----\n登録\n[校舎名]\n[氏名]\n-----\n\nと入力します';
            pushReply(userID,mes);
            break;
          }
          // フォルダ作成完了
          altText = "フォルダ作成完了";
          contents = {
            "type": "carousel",
            "contents": [
              {
                "type": "bubble",
                "hero": {
                  "type": "image",
                  "size": "full",
                  "aspectRatio": "16:9",
                  "aspectMode": "cover",
                  "url": "------------------------------------",
                  "action": {
                    "type": "uri",
                    "label": "action",
                    "uri": userfolderurl
                  }
                },
                "body": {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    {
                      "type": "text",
                      "text": "登録完了！",
                      "size": "xl",
                      "weight": "bold"
                    },
                    {
                      "type": "box",
                      "layout": "vertical",
                      "contents": [
                        {
                          "type": "text",
                          "text": "「フォルダ」と入力すると",
                          "align": "end"
                        },
                        {
                          "type": "text",
                          "text": "リンクを受け取れます！",
                          "align": "end"
                        }
                      ]
                    }
                  ]
                }
              },
              {
                "type": "bubble",
                "hero": {
                  "type": "image",
                  "size": "full",
                  "aspectRatio": "16:9",
                  "aspectMode": "cover",
                  "url": "---------------------------------------",
                  "action": {
                    "type": "uri",
                    "label": "action",
                    "uri": userreporturl
                  }
                },
                "body": {
                  "type": "box",
                  "layout": "vertical",
                  "spacing": "sm",
                  "contents": [
                    {
                      "type": "text",
                      "text": "業務報告書シート",
                      "wrap": true,
                      "weight": "bold",
                      "size": "xl"
                    },
                    {
                      "type": "box",
                      "layout": "vertical",
                      "flex": 1,
                      "contents": [
                        {
                          "type": "text",
                          "text": "「シート」と入力すると",
                          "wrap": true,
                          "flex": 0,
                          "align": "end"
                        },
                        {
                          "type": "text",
                          "text": "リンクを受け取れます！",
                          "align": "end"
                        },
                        {
                          "type": "text",
                          "text": "毎月リンクは変わります",
                          "size": "xxs"
                        }
                      ]
                    }
                  ]
                }
              }
            ]
          };
          pushFlex(userID,altText,contents);
          // ヘルプメニュー表示
          contents = gethelpcontents();
          pushFlex(userID,altText,contents);
          break;

        case "研修":
          if(!isNaN(userMessage[1])){
            let num = Number(userMessage[1]);
            mes = regist_kenshuu(userID,num);
            if(isKoutuuhi){
              mes = mes + '\n（交通費有）';
            }
          }else{
            mes = '【エラー】\nコマ数の登録には半角数字を使用してください！';
          }
          pushReply(userID,mes);
          break;

        case "事務":
          if(userMessage.length == 3){
            mes = regist_jimu(userID,userMessage[1],userMessage[2]);
            if(isKoutuuhi){
              mes = mes + '\n（交通費有）';
            }
          }else{
            mes = '【エラー】\n使い方に誤りがあります！\n詳しい使い方はヘルプを参照してください！';
          }
          pushReply(userID,mes);
          break;

        case "PCR":
          mes = regist_PCR(userID,userMessage[1],userMessage[2]);
          if(isKoutuuhi){
            mes = mes + '\n（交通費有）';
          }
          pushReply(userID,mes);
          break;

        case "交通費":
          if(userMessage[1] == 'デフォルト'){
            let money = userMessage[2];
            if(money == '解除'){
              let {userreportID,i,row} = getusersheet(userID);
              let userlistsheet = SpreadsheetApp.openById(userlistsheetID).getSheets()[i];
              userlistsheet.getRange(row,5).setValue("");
              isKoutuuhi = false;
              mes = '交通費のデフォルト設定を解除しました！';
              pushReply(userID,mes);
              break;
            }else if(isNaN(money)){
              mes = '【エラー】\n金額指定に誤りがあります！';
              pushReply(userID,mes);
              break;
            }
            var {userreportID,i,row} = getusersheet(userID);
            var userlistsheet = SpreadsheetApp.openById(userlistsheetID).getSheets()[i];
            userlistsheet.getRange(row,5).setValue(money);
            isKoutuuhi = false;
            mes = '交通費￥' + money + 'をデフォルトに設定しました！';
            pushReply(userID,mes);
            break;
          }
          mes = regist_koutuuhi(userID,userMessage[1]);
          pushReply(userID,mes);
          break;

        case "シート":
          var {userreportID,i,row} = getusersheet(userID);
          var userlistsheet = SpreadsheetApp.openById(userlistsheetID).getSheets()[i];
          var school = 'Wam' + userlistsheet.getSheetName() + '校';
          let month = thismonth.toString() + "月";
          let file = DriveApp.getFileById(userreportID);
          let fileurl = file.getUrl();
          isKoutuuhi = false;
          altText = "業務報告書シートリンク"
          contents = {
            "type": "bubble",
            "hero": {
              "type": "image",
              "size": "full",
              "aspectRatio": "16:9",
              "action": {
                "type": "uri",
                "uri": fileurl
                },
                "position": "relative",
                "url": "----------------------------------------"
                },
                "body": {
                  "type": "box",
                  "layout": "vertical",
                  "spacing": "md",
                  "contents": [
                    {
                      "type": "text",
                      "text": "業務報告書",
                      "size": "xl",
                      "weight": "bold"
                  },
                  {
                    "type": "box",
                    "layout": "vertical",
                    "spacing": "sm",
                    "contents": [
                      {
                        "type": "box",
                        "layout": "horizontal",
                        "contents": [
                          {
                            "type": "text",
                            "text": school,
                            "margin": "sm",
                            "flex": 0
                        },
                        {
                          "type": "text",
                          "text": month,
                          "size": "sm",
                          "align": "end"
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          };
          pushFlex(userID,altText,contents);
          break;

        case "フォルダ":
          var {userreportID,i,row} = getusersheet(userID);
          var userlistsheet = SpreadsheetApp.openById(userlistsheetID).getSheets()[i];
          var school = 'Wam' + userlistsheet.getSheetName() + '校';
          let userfolderID = userlistsheet.getRange(row,3).getValue();
          let folder = DriveApp.getFolderById(userfolderID);
          let folderurl = folder.getUrl();
          isKoutuuhi = false;
          altText = "フォルダURL"
          contents = {
            "type": "bubble",
            "hero": {
              "type": "image",
              "size": "full",
              "aspectRatio": "16:9",
              "action": {
                "type": "uri",
                "uri": folderurl
                },
                "position": "relative",
                "url": "---------------------------------------------"
                },
                "body": {
                  "type": "box",
                  "layout": "vertical",
                  "spacing": "md",
                  "contents": [
                    {
                      "type": "text",
                      "text": "フォルダ",
                      "size": "xl",
                      "weight": "bold"
                  },
                  {
                    "type": "box",
                    "layout": "vertical",
                    "spacing": "sm",
                    "contents": [
                      {
                        "type": "box",
                        "layout": "horizontal",
                        "contents": [
                          {
                            "type": "text",
                            "text": school,
                            "margin": "sm",
                            "flex": 0
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          };
          pushFlex(userID,altText,contents);
          break;

        case "取り消す":
          mes = remove(userID);
          pushReply(userID,mes);
          isKoutuuhi = false;
          break;

        case "me":
          mes = userID;
          pushReply(userID,mes);
          break;

        case "登録解除":
          mes = unregister(userID);
          pushReply(userID,mes);
          break

        case "ヘルプ":
          let type = "";
          if(userMessage.length == 1){
            type = "";
          }else{
            type = userMessage[1];
          }
          // 通常・事務・PCR・交通費のオプションに従ってcontentsを選択
          contents = gethelpcontents(type);
          pushFlex(userID,altText,contents);
          break;

        case "新規作成":
          // !admin 新規作成 [校舎名] [氏名]
          getAdmin(userID);
          if(isAdmin){
            mes = makesheet(userMessage[1],userMessage[2]);
          }else{
            mes = '実行権限がありません！';
          }
          pushReply(userID,mes);
          break;

        case "admin":
          // admin新規登録 !admin admin [校舎名]
          if(isAdmin){
            mes = regist_admin(userID,userMessage[1])
          }else{
            mes = '実行権限がありません！';
          }
          pushReply(userID,mes);
          break;

        case "dummy":
          break;

        default:
          mes = '【エラー】\n使い方が正しくありません！\n詳しい使い方は「ヘルプ」を参照してください！';
          pushReply(userID,mes);
      }
      
      setlog(userID,eventData.message.text);

      if(isKoutuuhi){
        let {userreportID,i,row} = getusersheet(userID);
        // 金額取得
        let userlistsheet = SpreadsheetApp.openById(userlistsheetID).getSheets()[i];
        let money = userlistsheet.getRange(row,5).getValue();
        let usersheet = SpreadsheetApp.openById(userreportID).getSheets()[0];
        let activerow = getsheetrow(usersheet);
        usersheet.getRange(activerow,17).setValue(money);
      }
    }
  }
  return;
}

// 【登録】登録作業を行います．返り値はmesです
function regist(userID,school,username){
  if(getusersheet(userID)){
    mes = 'すでに登録が完了しているようです！';
    return mes;
  }
  try{
    school = school.replace('校','');
    username = username.replace('　',' ');
    if(!username.includes(' ')){
      mes = '【エラー】\n「氏名」の指定には姓と名の間にスペースが必要です！'
      return mes;
    }
    var userlistsheet = SpreadsheetApp.openById(userlistsheetID).getSheetByName(school);
    var schoolfolderID = userlistsheet.getRange(1,2).getValue();
  }catch(e){
    mes = '【エラー】\n校舎名が登録されていないまたは、校舎名が違います！';
    return mes;
  }
  // ユーザーフォルダの作成
  let schoolfolder = DriveApp.getFolderById(schoolfolderID);
  let userfolder = schoolfolder.createFolder(username);
  let userfolderID = userfolder.getId();
  userfolderurl = userfolder.getUrl();
  // 業務報告書原本を作成したフォルダにコピー
  let originalreportfile = DriveApp.getFileById(originalreportID);
  let userreport = originalreportfile.makeCopy(username,userfolder);
  userreport.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.EDIT);
  let userreportID = userreport.getId();
  userreporturl = userreport.getUrl();
  SpreadsheetApp.flush();
  // 業務報告書に記名
  userreport = SpreadsheetApp.openById(userreportID).getSheets()[0];
  userreport.setName(username);
  userreport.getRange(schoolfield).setValue(school + '校');
  userreport.getRange(namefield).setValue(username);

  //ユーザー情報を収集  
  let userinfo = [];
  userinfo[0] = username;
  userinfo[1] = userID;
  userinfo[2] = userfolderID;
  userinfo[3] = userreportID;
  userlistsheet.appendRow(userinfo);
  mes = '〈' + school + '校〉\n' + username + 'さんを登録しました！\nこれから利用することができます！';
  return mes;
}

// 【通常】通常コマを記録します．返り値はmesです
function regist_tuujou(userID,num){
  if(num >= 8 || num <= 0){
    mes = '【エラー】\n指定コマ数に問題があります！';
    return mes;
  }
  let {userreportID,i,row} = getusersheet(userID);
  let usersheet = SpreadsheetApp.openById(userreportID).getSheets()[0];
  let activerow = getsheetrow(usersheet);

  if(Number.isInteger(num)){
    // 整数の場合
    usersheet.getRange(activerow,3).setValue(num);
    mes = mes + '通常（90分）' + num + 'コマで登録しました！';
  }else{
    // 小数の場合
    num = Math.floor(num * 10) / 10;
    // num1整数部分
    let num1 = Math.floor(num);
    // num2小数第一位部分
    let num2 = Math.floor(num * 10 - num1 * 10);
    if(num1){
      usersheet.getRange(activerow,3).setValue(num1);
      mes = mes + '通常（90分）' + num1 + 'コマ\n';
    }
    usersheet.getRange(activerow,4).setValue(num2);
    mes = mes + '通常（40分）' + num2 + 'コマで登録しました！';
  }
  SpreadsheetApp.flush();
  sort(usersheet,activerow);
  return mes;
}

// 【研修】日付と研修コマを記録します．返り値はmesです
function regist_kenshuu(userID,num){
  let {userreportID,i,row} = getusersheet(userID);
  let usersheet = SpreadsheetApp.openById(userreportID).getSheets()[0];
  let activerow = getsheetrow(usersheet);
  usersheet.getRange(activerow,5).setValue(num);
  mes = mes + '研修 ' + num + 'コマで登録しました！';
  SpreadsheetApp.flush();
  sort(usersheet,activerow);
  return mes;
}

// 【事務】日付と事務勤務時間を記録します．返り値はmesです
function regist_jimu(userID,time1,time2){
  let {userreportID,i,row} = getusersheet(userID);
  let usersheet = SpreadsheetApp.openById(userreportID).getSheets()[0];
  let activerow = getsheetrow(usersheet);
  if(!time1.includes(':')){
    mes = '【エラー】\n開始時間の書き方が正しくありません！'
    return mes;
  }else if(!time2.includes(':')){
    mes = '【エラー】\n終了時間の書き方が正しくありません！'
    return mes;
  }
  let [hour1,min1] = time1.split(':');
  let [hour2,min2] = time2.split(':');
  let before = new Date();
  let after = new Date();
  before.setHours(hour1);
  before.setMinutes(min1);
  before.setSeconds(0,0,0,0);
  after.setHours(hour2);
  after.setMinutes(min2);
  after.setSeconds(0,0,0,0);

  if(before > after){
    mes = '【エラー】\n時間指定に誤りがあります！';
    return mes;
  }
  let hours = (after - before) / 3600000;
  let values = [hours,hour1,min1,hour2,min2];

  for(let i=0;i<jimu_block.length;i++){
    usersheet.getRange(activerow,jimu_block[i]).setValue(values[i]);
  }
  mes = mes + '事務 ' + hours + '時間（' + hour1 + ':' + min1 + '～' + hour2 + ':' + min2 + '）で登録しました！';
  sort(usersheet,activerow);
  return mes;
}

//　【PCR検査】PCR検査を記録します．返り値はmesです
function regist_PCR(userID,day,time){
  let {userreportID,i,row} = getusersheet(userID);
  let usersheet = SpreadsheetApp.openById(userreportID).getSheets()[0];
  let activerow = getsheetrow(usersheet);
  if(day == '平日'){
    usersheet.getRange(activerow,15).setValue(time);
  }else if(day == '土日祝'){
    usersheet.getRange(activerow,16).setValue(time);
  }else{
    mes = '【エラー】\n使い方に誤りがあります！';
    return mes;
  }
  
  mes = mes + 'PCR検査（' + day + '）' + time + '時間で登録しました！';
  SpreadsheetApp.flush();
  sort(usersheet,activerow);
  return mes;
}

// 【交通費】交通費を記録します．返り値はmesです
function regist_koutuuhi(userID,money){
  if(isNaN(money)){
    mes = '【エラー】\n金額指定に誤りがあります！';
    return mes;
  }
  let {userreportID,i,row} = getusersheet(userID);
  let usersheet = SpreadsheetApp.openById(userreportID).getSheets()[0];
  let activerow = getsheetrow(usersheet);
  usersheet.getRange(activerow,17).setValue(money);
  isKoutuuhi = false;
  mes = mes + '交通費 ￥' + money + 'で登録しました！';
  SpreadsheetApp.flush();
  sort(usersheet,activerow);
  return mes;
}

// 登録解除を行います．monthlychangeでuserIDがない場合、講師を削除するようになっているのでここではuserIDの削除のみを行います
function unregister(userID){
  let {userreportID,i,row} = getusersheet(userID);
  let userlistsheet = SpreadsheetApp.openById(userlistsheetID).getSheets()[i];
  userlistsheet.getRange(row,2).setValue(null);
  mes = "登録を解除しました！";
  return mes;
}

// シートを登録なしに作成します．主に別校舎のヘルプで使用します
function makesheet(school,username){
  school = school.replace('校','');
  username = username.replace('　',' ');
  let userlist = SpreadsheetApp.openById(userlistsheetID).getSheetByName(school);
  let schoolfolderID = userlist.getRange(1,2).getValue();
  let schoolfolder = DriveApp.getFolderById(schoolfolderID);
  let userfolder = schoolfolder.createFolder(username);
  let userfolderID = userfolder.getId();
  // 業務報告書原本を作成したフォルダにコピー
  let originalreportfile = DriveApp.getFileById(originalreportID);
  let userreport = originalreportfile.makeCopy(username,userfolder);
  userreport.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.EDIT);
  let userreportID = userreport.getId();
  userreporturl = userreport.getUrl();
  SpreadsheetApp.flush();
  // 業務報告書に記名
  userreport = SpreadsheetApp.openById(userreportID).getSheets()[0];
  userreport.getRange(schoolfield).setValue(school + '校');
  userreport.getRange(namefield).setValue(username);
  //ユーザー情報を収集  
  let userinfo = [];
  userinfo[0] = username;
  userinfo[2] = userfolderID;
  userinfo[3] = userreportID;
  userlistsheet.appendRow(userinfo);
  mes = school + '校に' + username + 'さんの業務報告書を作成しました！';
  return mes;
}

// adminを新規登録します．adminは最大1人しか登録できません．すでに登録されている場合削除の手続きが必要になります
function regist_admin(userID,school){
  school = school.replace('校','');
  let userlist = SpreadsheetApp.openById(userlistsheetID).getSheetByName(school);
  let adminID = userlist.getRange(1,6).getValue();
  if(adminID){
    mes = 'すでにadminが登録されています！';
    return mes;
  }
  userlist.getRange(1,6).setValue(userID);
  mes = 'adminに登録しました！';
  return mes;
}

// adminかどうか判定します．adminの場合isAdminがインクリメントされます．trueの場合返り値は所属校舎シート番号です
function getAdmin(userID){
  let userlistsheet = SpreadsheetApp.openById(userlistsheetID).getSheets();
  let num_school = userlistsheet.length;
  for(let i=0;i<num_school;i++){
    let userlist = userlistsheet[i];
    let adminID = userlist.getRange(1,6).getValue();
    if(userID == adminID){
      isAdmin++;
      return i;
    }
  }
}

function gethelpcontents(type){
  switch(type){
    case "通常":
      altText = "通常ヘルプ";
      contents = {
        "type": "carousel",
        "contents": [
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "size": "full",
              "aspectRatio": "16:9",
              "aspectMode": "cover",
              "url": "-----------------------------------------"
            }
          },
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "size": "full",
              "aspectRatio": "16:9",
              "aspectMode": "cover",
              "url": "-----------------------------------------------------"
            }
          },
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "size": "full",
              "aspectRatio": "16:9",
              "aspectMode": "cover",
              "url": "---------------------------------------------------------"
            }
          },
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "size": "full",
              "aspectRatio": "16:9",
              "aspectMode": "cover",
              "url": "--------------------------------------------------------"
            }
          }
        ]
      };
      break;

    case "事務":
      altText = "事務ヘルプ";
      contents = {
        "type": "carousel",
        "contents": [
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "size": "full",
              "aspectRatio": "16:9",
              "aspectMode": "cover",
              "url": "-----------------------------------------------------"
            }
          },
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "size": "full",
              "aspectRatio": "16:9",
              "aspectMode": "cover",
              "url": "---------------------------------------------"
            }
          }
        ]
      };
      break;

    case "PCR":
      altText = "PCRヘルプ";
      contents = {
        "type": "carousel",
        "contents": [
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "size": "full",
              "aspectRatio": "16:9",
              "aspectMode": "cover",
              "url": "----------------------------------------------------"
            }
          },
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "size": "full",
              "aspectRatio": "16:9",
              "aspectMode": "cover",
              "url": "------------------------------------------------------------"
            }
          }
        ]
      };
      break;

    case "交通費":
      altText = "交通費ヘルプ";
      contents = {
        "type": "carousel",
        "contents": [
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "size": "full",
              "aspectRatio": "16:9",
              "aspectMode": "cover",
              "url": "---------------------------------------------------"
            }
          },
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "size": "full",
              "aspectRatio": "16:9",
              "aspectMode": "cover",
              "url": "-----------------------------------------------------"
            }
          },
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "size": "full",
              "aspectRatio": "16:9",
              "aspectMode": "cover",
              "url": "------------------------------------------------------"
            }
          },
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "size": "full",
              "aspectRatio": "16:9",
              "aspectMode": "cover",
              "url": "-----------------------------------------------------"
            }
          }
        ]
      };
      break;
    
    case "取り消す":
      altText = "取り消すヘルプ"
      contents = {
        "type": "carousel",
        "contents": [
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "size": "full",
              "aspectRatio": "16:9",
              "aspectMode": "cover",
              "url": "----------------------------------------------------"
            }
          },
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "size": "full",
              "aspectRatio": "16:9",
              "aspectMode": "cover",
              "url": "--------------------------------------------------"
            }
          }
        ]
      };
      break;

    default:
      altText = "ヘルプメニュー";
      contents = {
        "type": "carousel",
        "contents": [
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "url": "--------------------------------------------------",
              "size": "full",
              "aspectRatio": "16:9"
            },
            "footer": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "記録は日付順に自動でソートされます",
                  "weight": "bold",
                  "align": "center"
                }
              ],
              "height": "74px",
              "backgroundColor": "#D2D0CC"
            }
          },
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "size": "full",
              "aspectRatio": "16:9",
              "aspectMode": "cover",
              "url": "--------------------------------------------------"
            },
            "footer": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "button",
                  "action": {
                    "type": "message",
                    "label": "詳細を表示",
                    "text": "ヘルプ\n通常"
                  }
                }
              ]
            }
          },
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "size": "full",
              "aspectRatio": "16:9",
              "aspectMode": "cover",
              "url": "--------------------------------------------------"
            },
            "footer": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "button",
                  "action": {
                    "type": "message",
                    "label": "詳細を表示",
                    "text": "ヘルプ\n事務"
                  }
                }
              ]
            }
          },
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "size": "full",
              "url": "--------------------------------------------------",
              "aspectRatio": "16:9",
              "aspectMode": "cover"
            },
            "footer": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "button",
                  "action": {
                    "type": "message",
                    "label": "詳細を表示",
                    "text": "ヘルプ\nPCR"
                  }
                }
              ]
            }
          },
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "size": "full",
              "url": "--------------------------------------------------",
              "aspectRatio": "16:9",
              "aspectMode": "cover"
            },
            "footer": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "button",
                  "action": {
                    "type": "message",
                    "label": "詳細を表示",
                    "text": "ヘルプ\n交通費"
                  }
                }
              ]
            }
          },
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "url": "--------------------------------------------------",
              "aspectRatio": "16:9",
              "size": "full"
            },
            "footer": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "button",
                  "action": {
                    "type": "message",
                    "label": "詳細を表示",
                    "text": "ヘルプ\n取り消す"
                  }
                }
              ]
            }
          }
        ]
      };
      break;
  }
  return contents;
}

// 取り消し機能 オプションを付け加える．返り値はmesです
function remove(userID){
  let {userreportID,i,row} = getusersheet(userID);
  let usersheet = SpreadsheetApp.openById(userreportID).getSheets()[0];
  let activerow = getsheetrow(usersheet);
  if(canremove){
    mes = '【エラー】\n指定の日付の報告がありません！';
    usersheet.getRange('A'+activerow).setValue('/');
    return mes;
  }
  usersheet.getRange('A'+activerow).setValue('/');
  usersheet.getRangeList(['C'+activerow,'D'+activerow,'E'+activerow,'F'+activerow,'G'+activerow,'H'+activerow,'J'+activerow,'L'+activerow,'N'+activerow,'O'+activerow,'P'+activerow,'Q'+activerow]).clearContent();
  mes = mm + '/' + dd + '（' + dayOfWeekStr[dayOfWeek] + '）のすべての報告を削除しました！';
  return mes;
}

// ユーザーの報告書ID、シート番号、行番号を返します.ヒットしない場合はfalseを返します
function getusersheet(userID){
  let userlistsheet = SpreadsheetApp.openById(userlistsheetID).getSheets();
  let num_school = userlistsheet.length;
  for(let i=0;i<num_school;i++){
    let userlist = userlistsheet[i];
    let lastrow = userlist.getLastRow();
    let values = userlist.getRange(1,1,lastrow,7).getValues();
    for(let row=1;row<lastrow;row++){
      if(values[row][1] == userID){
        let timestamp = new Date();
        userreportID = values[row][3];
        userlist.getRange(row+1,6).setValue(timestamp);
        if(values[row][4]){
          isKoutuuhi = true;
        }
        // index処理
        row = row + 1;
        return {userreportID,i,row};
      }
    }
  }
  return false;
}

// 報告書のレポート最終行を返します．この時、日付も登録します．すでに同じ日付が記入されている場合はその行を返します
function getsheetrow(usersheet){
  let values = usersheet.getRange(10,1,25).getValues();
  values = Array.prototype.concat.apply([],values);
  for(let row=0;row<=25;row++){
    let value = values[row];
    if(value == '/'){
      // 日付登録
      usersheet.getRange(row+10,1).setValue(mm + '/' + dd);
      canremove = true;
      return row+10;
    }
    let month = value.getMonth() + 1;
    let day = value.getDate();
    if(month == mm && day == dd){
      return row+10;
    }
  }
  return;
}

// 報告書の最終レポート行を返します．探索は下から上に行います
function getlastreportrow(usersheet){
  for(let row=34;row>=10;row--){
    let value = usersheet.getRange(row,1).getValue();
    if(value != '/'){
      return row;
    }
  }
  return;
}

// 報告を日付順に整列します．返り値none
function sort(usersheet,activerow){
  usersheet.getRange(10,1,activerow-9,17).sort(1);
  return;
}

function pushFlex(userID,altText,contents){
  let payload = {
      'to': userID,
      'messages': [{
        'type': 'flex',
        'altText': altText,
        'contents': contents
      }]
  };
  let options = {
    'payload' : JSON.stringify(payload),
    'myamethod'  : 'POST',
    'headers' : {"Authorization" : "Bearer " + token},
    'contentType' : 'application/json'
  };
  let url = 'https://api.line.me/v2/bot/message/push';
  UrlFetchApp.fetch(url, options);
}

function pushReply(userID,mes){
  let payload = {
      'to': userID,
      'messages': [{
        'type': 'text',
        'text': mes
      }]
  };
  let options = {
    'payload' : JSON.stringify(payload),
    'myamethod'  : 'POST',
    'headers' : {"Authorization" : "Bearer " + token},
    'contentType' : 'application/json'
  };
  let url = 'https://api.line.me/v2/bot/message/push';
  UrlFetchApp.fetch(url, options);
}

// 月変わりに定期で実行する
function monthlychange(){
  let timestamp = new Date();
  let pastday = new Date();
  pastday.setDate(pastday.getDate() - 15);
  let lastyyyy = pastday.getFullYear();
  let lastmm = pastday.getMonth() + 1;
  // 原本の年月を変更
  let originalreportfile = DriveApp.getFileById(originalreportID);
  let originalreport = SpreadsheetApp.openById(originalreportID);
  // 年の変更
  yyyy = timestamp.getFullYear();
  originalreport.getRange("A4").setValue(yyyy);
  // 月の変更
  mm = timestamp.getMonth() + 1;
  originalreport.getRange("C4").setValue(mm);
  SpreadsheetApp.flush()

  // 校舎アーカイブフォルダに先月のフォルダを作成、報告書の移動
  let userlistsheet = SpreadsheetApp.openById(userlistsheetID).getSheets();
  let num_school = userlistsheet.length;
  for(var i=0;i<num_school;i++){
    var userlist = userlistsheet[i];
    var lastrow = userlist.getLastRow();
    var archievefolderID = userlist.getRange("D1").getValue();
    var archievefolder = DriveApp.getFolderById(archievefolderID);
    var monthfolder = archievefolder.createFolder(lastyyyy.toString() + '_' + lastmm.toString());
    // 作成したmonthfolderに講師全員の報告書を移動
    for(var row=3;row<=lastrow;row++){
      var userreportID = userlist.getRange(row,4).getValue();
      var userreportfile = DriveApp.getFileById(userreportID);
      userreportfile.moveTo(monthfolder);
    }
    Utilities.sleep(3000);

    var sheet = createSpreadsheet('@全講師業務報告書');
    var sheetid = sheet.getId();
    var sumfile = DriveApp.getFileById(sheetid);
    var sumfiles = monthfolder.getFiles();
    while(sumfiles.hasNext()){
      var file = sumfiles.next();
      var sheet_copy = SpreadsheetApp.openById(file.getId()).getSheets()[0];
      sheet_copy.copyTo(sheet);
    }
    // 1枚目(まっさらなシート1)を削除
    var head = sheet.getSheets()[0];
    sheet.deleteSheet(head);
    // 月フォルダに移動　pdf形式に出力
    sumfile.moveTo(monthfolder);
    var pdf = sheet.getAs('application/pdf').setName('@全講師業務報告書.pdf');
    monthfolder.createFile(pdf);
  }

  // ヘルプ登録(userIDが未登録)されている講師または退職講師の来月の報告書を作成しないために、フォルダとuserlist中の列を削除する
  for(var i=0;i<num_school;i++){
    var userlist = userlistsheet[i];
    var lastrow = userlist.getLastRow();
    for(var row=lastrow;row<=3;row--){
      if(!userlist.getRange(row,2).getValue()){
        var userfolderID = userlist.getRange(row,3).getValue();
        var userfolder = DriveApp.getFolderById(userfolderID); //ここでエラー
        userfolder.setTrashed(true);
        userlist.deleteRow(row);
      }
    }
  }
  SpreadsheetApp.flush()

  // それぞれのフォルダIDに原本をコピー(ANYONE,EDIT)、createdファイルIDを記録、コピーファイルに校舎名、氏名、教師番号、(報酬単価)を記入
  for(var i=0;i<num_school;i++){
    var userlist = userlistsheet[i];
    var school = userlist.getSheetName() + '校';
    var lastrow = userlist.getLastRow();
    for(var row=3;row<=lastrow;row++){
      // 報告書の原本をコピー
      var userfolderID = userlist.getRange(row,3).getValue();
      var userfolder = DriveApp.getFolderById(userfolderID);
      var username = userlist.getRange(row,1).getValue();
      var userNumber = userlist.getRange(row,7).getValue();
      var price = userlist.getRange(row,8).getValue();
      var userreport = originalreportfile.makeCopy(username,userfolder);
      var userreportID = userreport.getId();
      // 権限変更
      userreport.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.EDIT);      
      // 校舎名、氏名、教師番号、(報酬単価)記入
      userreport = SpreadsheetApp.openById(userreportID).getSheets()[0];
      userreport.setName(username);
      userreport.getRange(schoolfield).setValue(school);
      userreport.getRange(namefield).setValue(username);
      userreport.getRange(userIDfield).setValue(userNumber);
      if(price){
        userreport.getRange(pricefield).setValue(price);
      }
      // 新しいシートIDを記録
      userlist.getRange(row,4).setValue(userreportID);
    }
  }
}

// 新しいスプレッドシートを作成する 作成する場所は一番下のレベルなのでmoveToが必須です
function createSpreadsheet(name){
  let file = SpreadsheetApp.create(name);
  file.setSpreadsheetLocale('ja_JP');
  file.setSpreadsheetTimeZone('Asia/Tokyo');
  let fileid = file.getId();
  file = DriveApp.getFileById(fileid);
  return SpreadsheetApp.openById(file.getId());
}

function setlog(userID,userMessage){
  let timestmp = new Date();
  let usermes = userMessage.replace(/\r\n|\n/g,' ');
  let logsheet = SpreadsheetApp.openById(logsheetID).getSheets()[0];
  logsheet.appendRow([timestmp,userID,usermes]);
}

function debug(){
  let originalreportfile = DriveApp.getFileById(originalreportID);
  let userlistsheet = SpreadsheetApp.openById(userlistsheetID).getSheets();
  let num_school = userlistsheet.length;
  for(var i=0;i<num_school;i++){
    var userlist = userlistsheet[i];
    var school = userlist.getSheetName() + '校';
    var lastrow = userlist.getLastRow();
    for(var row=3;row<=lastrow;row++){
      // 報告書の原本をコピー
      var userfolderID = userlist.getRange(row,3).getValue();
      var userfolder = DriveApp.getFolderById(userfolderID);
      var username = userlist.getRange(row,1).getValue();
      var userNumber = userlist.getRange(row,7).getValue();
      var price = userlist.getRange(row,8).getValue();
      var userreport = originalreportfile.makeCopy(username,userfolder);
      var userreportID = userreport.getId();
      // 権限変更
      userreport.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.EDIT);      
      // 校舎名、氏名、教師番号、(報酬単価)記入
      userreport = SpreadsheetApp.openById(userreportID).getSheets()[0];
      userreport.setName(username);
      userreport.getRange(schoolfield).setValue(school);
      userreport.getRange(namefield).setValue(username);
      userreport.getRange(userIDfield).setValue(userNumber);
      if(price){
        userreport.getRange(pricefield).setValue(price);
      }
      // 新しいシートIDを記録
      userlist.getRange(row,4).setValue(userreportID);
    }
  }
}
