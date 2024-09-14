// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');

// =========================================================================================================================================
// CONST AND LET 
// =========================================================================================================================================

let NEW_GAME = true;
let SCORE = 0;
let INVALID_OPTION = false;
const GAME_LENGTH = 10;

const SPEECH_CORRECT = ['Muito bem', 'Show de bola', 'Show', 'Parabéns', 'Isso aí'];
const SPEECH_CORRECT_COMPLEMENT = ['Você está certo', 'Você acertou', 'Você está correto', 'Sua resposta está certa', 'Sua resposta está correta']

const SPEECH_INCORRECT = ['Poxa', 'Que pena', 'Hmmmmm', 'Não deu', 'Não foi dessa vez'];
const SPEECH_INCORRECT_COMPLEMENT = ['Você está errado', 'Você errou', 'Sua resposta está errada', 'Sua resposta está incorreta']

// =========================================================================================================================================
// HELPERS
// =========================================================================================================================================

function randomNumber() {
  return Math.floor(Math.random() * 10) + 1;
}

function getRandomSpeech(min, max) {
  return Math.floor((Math.random() * ((max - min) + 1)) + min);
}

function shuffle(o) {
  for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
}

function isResponseSlotValid(intent) {
  return !Number.isNaN(parseInt(intent.slots.numero.value, 10));
}

function populateRandomQuestion() {
  let shuffleIndex = [];
  let index = GAME_LENGTH;
  const gameQuestions = [];
  const indexList = [];

  for (let i = 0; i <= GAME_LENGTH; i += 1) {
    indexList.push(i);
  }
  // Shuffle questions 1 to 10
  shuffleIndex = shuffle(indexList.slice(1));
  for (let i = 0; i < shuffleIndex.length; i += 1) {
    gameQuestions.push(shuffleIndex[i])
  }
  return gameQuestions;
}

function isValidNumber(handlerInput, number) {
  if (number > 10) {
    return true;
  } else {
    const speakOutput = `Desculpe, eu só sei a tabuada até o número dez. De qual número você quer saber?`;
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }

}

function askQuestion(handlerInput, speakOutput) {
  if (NEW_GAME) {
    startGame(handlerInput);
  }
    
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  const { number, currentIndex, randomList } = sessionAttributes;

  if (currentIndex >= GAME_LENGTH) {
    throw Error('Game over')
  }

  const question = `Quanto é ${number} vezes ${randomList[currentIndex]}?`;
  let speak = speakOutput ? speakOutput + question : question;
  const result = number * randomList[currentIndex];

  sessionAttributes.currentIndex = + currentIndex + 1;
  sessionAttributes.result = result;

  return handlerInput.responseBuilder
    .speak(speak)
    .reprompt(question)
    .getResponse();
}

function startGame(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const randomList = populateRandomQuestion();
    sessionAttributes.currentIndex = 0;
    sessionAttributes.randomList = randomList;
    NEW_GAME = false;
    SCORE = 0;
}
// =========================================================================================================================================
// INTENT
// =========================================================================================================================================
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speakOutput = 'Que legal! Vamos aprender a tabuada! Eu posso te ensinar ou testar seus conhecimentos. Quer aprender ou quer que eu tome a tabuada?';
    const repromptText = 'Eu sei a tabuada do um ao dez. Qual deles voce quer saber?';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};
const LearnTabuadaIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LearnTabuadaIntent';
  },
  handle(handlerInput) {
    let speak = '';
    const number = handlerInput.requestEnvelope.request.intent.slots.numero.value;

    isValidNumber(handlerInput, number);

    for (let i = 1; i <= 10; i++) {
      speak += `${number} vezes ${i}, é igual a ` + number * i + '. ';
    }
    
    NEW_GAME = true;

    return handlerInput.responseBuilder
      .speak(speak)
      .withShouldEndSession(true)
      .getResponse();
  }
};

const AskTabuadaIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AskTabuadaIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const number = handlerInput.requestEnvelope.request.intent.slots.numero.value;
    const { intent } = handlerInput.requestEnvelope.request;
    
    if (!isResponseSlotValid(intent)) {
      INVALID_OPTION = true;
      throw new Error('Invalid Response.');
    }

    sessionAttributes.number = number;

    isValidNumber(handlerInput, number);

    const speakOut = `Vou tomar a tabuada do ${number}. `

    return askQuestion(handlerInput, speakOut)

  }
};

const QuestionTabuadaIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'QuestionTabuadaIntent';
  },
  handle(handlerInput) {
    let speakOut = '';
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const { number, result } = sessionAttributes;

    if (!number) {
      INVALID_OPTION = true;
      throw Error('Without number');
    }

    const responseNumber = handlerInput.requestEnvelope.request.intent.slots.numero.value;
    const { intent } = handlerInput.requestEnvelope.request;

    if (!isResponseSlotValid(intent)) {
      INVALID_OPTION = true;
      throw new Error('Invalid Response.');
    }

    if (parseInt(responseNumber, 10) === parseInt(result, 10)) {
      speakOut = `${SPEECH_CORRECT[getRandomSpeech(0, SPEECH_CORRECT.length - 1)]}. ${SPEECH_CORRECT_COMPLEMENT[getRandomSpeech(0, SPEECH_CORRECT_COMPLEMENT.length - 1)]}. `;
      SCORE = + SCORE + 1;
    } else {
      speakOut = `${SPEECH_INCORRECT[getRandomSpeech(0, SPEECH_INCORRECT.length - 1)]}. ${SPEECH_INCORRECT_COMPLEMENT[getRandomSpeech(0, SPEECH_INCORRECT_COMPLEMENT.length - 1)]}. A resposta certa era ${sessionAttributes.result}. `;
    }


    // Check if we can exit the game session after GAME_LENGTH questions (zero-indexed)
    if (sessionAttributes.currentIndex === GAME_LENGTH) {
        let speakFinal = ''
        if (SCORE >= 6) {
            speakFinal = `Parabéns, você acertou ${SCORE} de ${GAME_LENGTH}. Você é demais!`; 
        } else {
            speakFinal = `Que pena, você acertou apenas ${SCORE} de ${GAME_LENGTH}. Estude mais e tente novamente.`;            
        }
      
      
      NEW_GAME = true;

      return handlerInput.responseBuilder
        .speak(speakFinal)
        .getResponse();
    }
    return askQuestion(handlerInput, speakOut)

  }
};

const DontKnowIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DontKnowIntent';
  },
  handle(handlerInput) {
    let speakOut = '';
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const { number } = sessionAttributes;

    if (!number) {
      speakOut = 'Tudo bem. Eu sei a tabuada do um ao dez. Por exemplo, você pode escolher um número, e dizer, aprender a tabuada do dois.';
      return handlerInput.responseBuilder
        .speak(speakOut)
        .reprompt(speakOut)
        .getResponse();
    } else {
      speakOut = `Tudo bem. A resposta era ${sessionAttributes.result}. Vamos tentar o próximo. `;
      return askQuestion(handlerInput, speakOut)
    }
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speakOutput = 'Eu sei a tabuada do um ao dez. Você pode dizer, aprender tabuada ou tomar tabuada. O que você quer fazer?';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speakOutput = 'Tudo bem! Nos vemos em breve. Tchau!';
    
    NEW_GAME = true;
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  }
};
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    // Any cleanup logic goes here.
    return handlerInput.responseBuilder.getResponse();
  }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
  },
  handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const speakOutput = `You just triggered ${intentName}`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
      .getResponse();
  }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`~~~~ Error handled: ${error.stack}`);
    let speechOutput = '';
    if (INVALID_OPTION) {
      speechOutput = 'Opção inválida. Diga por exemplo, tabuada do dois.';
    } else {
      speechOutput = 'Desculpe, não consegui entender o que você disse. Tente novamente.';
    }

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    LearnTabuadaIntentHandler,
    AskTabuadaIntentHandler,
    QuestionTabuadaIntentHandler,
    DontKnowIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
  )
  .addErrorHandlers(
    ErrorHandler,
  )
  .lambda();
