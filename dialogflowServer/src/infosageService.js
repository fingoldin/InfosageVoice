"use strict";

const DATA = {
  "Viagra": {
    name: ["Viagra"],
    brands: [
      {
        name:"Revatio", 
        forms: [
          {
            units: [
              {
                name: "Sildenafil",
                amount: 1,
                unit: "mg",
                volume: "ml"
              }
            ],
            configuration: "oral solution"
          }
        ]
      },
      {
        name: "Sildenafil", 
        forms: [
          {
            units: [
              {
                name: "Sildenafil",
                amount: 1,
                unit: "mg",
                volume: "ml"
              }
            ],
            configuration: "oral solution"
          }
        ]
      },
      {
        name: ["Viagra"],
        forms: [
          {
            units: [
              {
                name: "Sildenafil",
                amount: 1,
                unit: "mg"
              }
            ],
            configuration: "oral tablet"
          }
        ]
      }
    ]
  },
  "Vicodin": {
    name: "Vicodin",
    brands: [
      {
        name:"Lorcet", 
        forms: [
          {
            units: [
              {
                name: "Vicodin",
                amount: 1,
                unit: "mg",
                volume: "ml"
              }
            ],
            configuration: "oral solution"
          }
        ]
      },
      {
        name: "Verdrocet", 
        forms: [
          {
            units: [
              {
                name: "Vicodin",
                amount: 1,
                unit: "mg",
                volume: "ml"
              }
            ],
            configuration: "oral solution"
          }
        ]
      },
      {
        name: "Vicodin",
        forms: [
          {
            units: [
              {
                name: "Vicodin",
                amount: 1,
                unit: "mg"
              }
            ],
            configuration: "oral tablet"
          }
        ]
      }
    ]
  }
}

function get(url, params) {
  return new Promise((resolve, reject) => {
    if(url == "drugInfo/") {
      resolve([ DATA["Vicodin"], DATA["Viagra"] ]);
    } else {
      reject();
    }
  });
}
exports.get = get;

function post(url, data) {
  return new Promise((resolve, reject) => {
    resolve();
  });
}
exports.post = post;
