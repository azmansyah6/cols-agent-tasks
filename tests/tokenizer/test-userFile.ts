import ma = require('vsts-task-lib/mock-answer');
import tmrm = require('vsts-task-lib/mock-run');
import path = require('path');
import fs = require('fs');

let rootDir = path.join(__dirname, '../../Tasks', 'Tokenizer');
let taskPath = path.join(rootDir, 'tokenizer.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

// set up a tmp file for the test
var workingFolder = path.join(__dirname, "working");
if (!fs.existsSync(workingFolder)) {
  fs.mkdirSync(workingFolder);
}
var tmpFile = path.join(workingFolder, "appsettings.json");

// provide answers for task mock
let a: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
    "checkPath": {
        "working": true
    },
    "findMatch": {
        "appsettings.json" : [ tmpFile ]
    }
};
tmr.setAnswers(a);

fs.writeFile(tmpFile, `
{
    "ConnectionStrings": {
      "AdminConnection": "Server=XPTO,1433;Initial Catalog=IDPXPTO;Persist Security Info=False;User ID=XPTO;Password=XPTO3;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
    },
    "Logging": {
      "LogLevel": {
        "Default": "Warning"
      }
    },
    "AppConfiguration": {
      "ArquivoCertificado": "IDPXPTO.pfx",
      "SenhaExportCertificado": "XPTO",
      "certThumbprint": "XPTO84A82063147D"
    },
    "AllowedHosts": "*"
}
`, (err) => {

  // set inputs
  tmr.setInput('sourcePath', "working");
  tmr.setInput('filePattern', 'appsettings.json');
  tmr.setInput('tokenizeType', 'Json');
  tmr.setInput('includes', ''); 
  tmr.setInput('excludes', '');
  tmr.setInput('nullBehavior', 'warning');

  tmr.run();

  // validate the replacement
  let actual = fs.readFileSync(tmpFile).toString();
  var expected = `{
  "ConnectionStrings": {
    "AdminConnection": "__ConnectionStrings.AdminConnection__"
  },
  "Logging": {
    "LogLevel": {
      "Default": "__Logging.LogLevel.Default__"
    }
  },
  "AppConfiguration": {
    "ArquivoCertificado": "__AppConfiguration.ArquivoCertificado__",
    "SenhaExportCertificado": "__AppConfiguration.SenhaExportCertificado__",
    "certThumbprint": "__AppConfiguration.certThumbprint__"
  },
  "AllowedHosts": "__AllowedHosts__"
}`;

  if (actual.trim() !== expected.trim()) {
    console.log(expected);
    console.log(actual);
    console.error("Tokenization failed.");
  } else {
    console.log("Tokenization succeeded!")
  }
});