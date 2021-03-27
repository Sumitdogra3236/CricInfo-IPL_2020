let fs=require("fs");
let path=require("path");
let cheerio=require("cheerio");
let request=require("request");


let dirPath=path.join(__dirname,"IPL_2021");

function createFolder(dirpath){
    if(!fs.existsSync(dirpath)){
        fs.mkdirSync(dirpath);
    }
}

createFolder(dirPath);

request("https://www.espncricinfo.com/series/ipl-2020-21-1210595/match-results",cb);
function cb(err,resp,html){
    if(err){
        console.log(err);
    }else{
        extractData(html);
    }
}

function extractData(html){
    let selTool=cheerio.load(html);
    let matchCards=selTool("a.match-info-link-FIXTURES");
    for(let i=0;i<matchCards.length;i++){
        let matchlinks=selTool(matchCards[i]).attr("href");
        let fullLink="https://www.espncricinfo.com/"+matchlinks;
         matchData(fullLink);

    }
}

function matchData(link){
    request(link, function(err,resp,html){
        if(err){
            console.log(err);
        }else{
            extractMatchData(html);
        }
    })
}

function extractMatchData(html){
    let selTool=cheerio.load(html);
    let teamNameArr=selTool(".match-info.match-info-MATCH .name");
    let batsmanTable=selTool(".table.batsman");

    let matchDetElem=selTool(".match-info.match-info-MATCH .description");

    let resElem=selTool(".match-info.match-info-MATCH .status-text")
    
    let venue=selTool(matchDetElem[0]).text().split(",")[1].trim();

    let date=selTool(matchDetElem[0]).text().split(",")[2].trim();

    let res=selTool(resElem[0]).text().trim();

    for(let i=0;i<batsmanTable.length;i++){
        let teamName=selTool(teamNameArr[i]).text();
        let opponent=selTool(teamNameArr[(i+1)%batsmanTable.length]).text()
        let batsmanArr=selTool(batsmanTable[i]).find("tbody tr .batsman-cell a");

        let batsmanElem=selTool(batsmanTable[i]).find("tbody tr td");
        let batsmanRun=selTool(batsmanElem[2]).text();
        let batsmanBall=selTool(batsmanElem[3]).text();
        let batsmanFur=selTool(batsmanElem[4]).text();
        let batsmanSix=selTool(batsmanElem[5]).text();
        let batsmanSR=selTool(batsmanElem[6]).text();


         teamCreator(dirPath,teamName);
        for(let j=0;j<batsmanArr.length;j++){
            let arr=[];

            let name=selTool(batsmanArr[j]).text();
            let orgName=name.split("(c)")[0].split("†")[0];
            let playerPath=path.join(dirPath,teamName,orgName+".json");

            if(fs.existsSync(playerPath)){
                let data=fs.readFileSync(playerPath);
                let ar=JSON.parse(data);
                for(let i=0;i<ar.length;i++){
                arr.push(ar[i]);
                }
            }
           
            arr.push({
                "Runs":batsmanRun,
                "Balls":batsmanBall,
                "Fours":batsmanFur,
                "Sixes":batsmanSix,
                "S.R":batsmanSR,
                "Date":date,
                "Venue":venue,
                "Result":res,
                "OpponentName":opponent

            })
            
              if(!fs.existsSync(playerPath)){
                  let createStream=fs.createWriteStream(playerPath);
                  createStream.end();
                }
             fs.writeFileSync(playerPath,JSON.stringify(arr));
             
        }
    }
}

function teamCreator(dirpath,teamName){
    let teamPath=path.join(dirpath,teamName);
    if(!fs.existsSync(teamPath)){
        fs.mkdirSync(teamPath);
    }
}