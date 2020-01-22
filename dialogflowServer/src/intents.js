"use strict";

const infosageService = require("./infosageService.js");

const intents = {
  "Add Medication": (c) => {
    infosageService.get("drugInfo", { name: c.parameters.name }).then((drugInfo) => {
      if(!drugInfo) {
        c.setFollowupEvent({ name: "query_custom_medication" });
        c.add("Would you like to");
      } else {
        c.setContext({ name: "add_medication_brand", lifespan: 2, params: { drugInfo: drugInfo } });

        let brandNames = "";
        for(let i = 0; i < drugInfo.brandNames.length - 1; i++) {
          brandNames += drugInfo.brandNames[i] + ", ";
        }
        if(drugInfo.brandNames.length > 1) {
          brandNames += "and ";
        }
        brandNames += drugInfo.brandNames[drugInfo.brandNames - 1];

        c.add("What is the brand name? The available options are " + brandNames);
      }
    });
  },
  "AddMedicationBrand": (c) => {
    let context = c.getContext("add_medication_brand");

    if(drugInfo.brands.indexOf(c.parameters.brand) === -1) {
      c.setContext({ name: "ask_custom", lifespan: 2, params: { name: c.parameters.name } });
      c.add("We don't have any records of that brand. Would you like to add this as a custom record?");
    } else  {
      c.setContext({ name: "add_medication_dosage", lifespan: 2, params: {
        drugInfo: context.params.drugInfo,
        drugParams: { ...context.params.drugParams, brand: brand }
      } });
      c.add("What is the dosage?");
    }
  },
  "add_medication_yes": (c) => {
    let drugInfo = c.getContext("add_medication_dosage").params.drugInfo;

    infosageService.post("add_medication", drugInfo).then(() => {
      c.add("Successfully added the medication");
    }, () => {
      c.add("There was an error adding the medication. Please try again");
    });
  },
  "Query Custom Medication - yes": (c) => {
    let med_name = c.getContext("custom_medication").parameters.name;
    c.setFollowupEvent({ name: "add_custom", parameters: { name: med_name } });
  },
  "add_custom": (c) => {
    infosageService.post("add_custom_medication", {
      name: c.parameters.name,
      brand: c.parameters.brand,
      dosage: c.parameters.dosage
    }).then(() => {
      c.add("The medication was added successfully");
    }, () => {
      c.add("There was an error adding the medication. Please try again");
    });
  }
};

exports.getIntentMap = () => {
  let map = new Map();
  for(let intent in intents) {
    map.set(intent, intents[intent]);
  }

  return map;
}
