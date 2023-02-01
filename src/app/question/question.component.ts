import { Component, OnInit } from '@angular/core';
import { interval } from 'rxjs';
import { QuestionService } from '../service/question.service';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-question',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.scss']
})
export class QuestionComponent implements OnInit {

  public name: string = "";
  public questionAmount: number = 10;
  public questionList: any = [];

  public questionID: number = 0;
  public questionText: string = "";
  public questionNumber: number = -1;
  public explanation: string = "";
  public options: any = [];
  public level: number = 0;
  public category: string = "";
  public points: number = 0;

  data: string = "";

  textAnswer: string = "";
  waitNext: boolean = true;
  correct: boolean = false;
  links: string[] = [];

  minutes: number = 10;
  seconds: number = 0;
  correctAnswer: number = 0;
  inCorrectAnswer: number = 0;
  attemptAnswer: number = 0;
  interval$: any;
  progress: string = "0";
  clicked: boolean = false;

  isQuizCompleted : boolean = false;
  questionAnswered: boolean = false;
  constructor(private questionService: QuestionService) { }

  ngOnInit(): void {
    this.name = "";
    this.questionAmount = 10;
    this.questionList = [];

    this.questionID = 0;
    this.questionText = "";
    this.questionNumber = -1;
    this.explanation = "";
    this.options = [];
    this.level = 0;
    this.category = "";
    this.points = 0;

    this.textAnswer = "";
    this.waitNext = true;
    this.correct = false;
    this.links = [];

    this.minutes = 10;
    this.seconds = 0;
    this.correctAnswer = 0;
    this.inCorrectAnswer = 0;
    this.attemptAnswer = 0;
    this.progress = "0";
    this.clicked = false;
    this.isQuizCompleted = false;
    this.questionAnswered = false;

    this.name = localStorage.getItem("name")!;
    this.getAllQuestions();
    this.startTimer();
  }

  randomize(questions: any[]) {
    var index = questions.length;
    while (index != 0) {
      var randomIndex = Math.floor(Math.random() * index);
      index--;
      [questions[index], questions[randomIndex]] = [questions[randomIndex], questions[index]];
    };
    return questions;
  }

  getAllQuestions() {
    this.questionService.getQuestionJson()
      .subscribe(res => {
        this.questionList = res.questions;
        this.nextQuestion();
      });
  }

  nextQuestion() {
    this.resetTimer();
    this.textAnswer="";
    this.correct = false;
    this.waitNext = true;
    this.questionAnswered = false;
    this.questionNumber++;
    if(this.questionNumber == this.questionAmount){
          this.writeScore();
          this.isQuizCompleted = true;
          this.stopTimer();
        }
    var nextQuestion: number;
    var _questionList = this.questionList.filter((q: any) => {return q.level == this.level});
    if (_questionList.length == 0) {
      _questionList = this.questionList;
    }
    var questionList = _questionList.filter((q: any) => {return q.category != this.category});
    if (questionList.length == 0) {
      questionList = _questionList;
    }
    nextQuestion = Math.floor(Math.random() * questionList.length);
    this.category = questionList[nextQuestion].category;
    this.level = questionList[nextQuestion].level;
    this.options = this.randomize(questionList[nextQuestion].options);
    this.explanation = questionList[nextQuestion].explanation;
    this.questionID = questionList[nextQuestion].id;
    this.links = questionList[nextQuestion].links;
    this.questionText = questionList[nextQuestion].questionText;
    this.questionList = this.questionList.filter((q: any) => {return q.questionText != this.questionText});
  }

  answer(option: any) {
    if (this.clicked) { return }
    if (this.textAnswer == "") {
        this.textAnswer = option.text;
    }
    this.data += "Question [";
    this.data += "Question ID: " + this.questionID + ", ";
    this.data += "Time remaining: " + this.minutes + ":" + this.seconds + ", ";
    this.data += "Answer: " + this.textAnswer + ", ";
    this.attemptAnswer++;
    if (this.category == "fill-in") {
        var correct = 0;
        var textAnswer = "";
        for (var i in this.options) {
            if (option.includes(this.options[i].text.toLowerCase())) {
                textAnswer = textAnswer.concat(" ", this.options[i].text);
                correct += 1;
            }
        }
        if (textAnswer != "") {
            this.textAnswer = textAnswer;
        }
        if (correct > 2 && this.questionID == 9) {
            correct = this.options.length;
        }
        if (correct == this.options.length) {
            option = {text: option, correct: true};
        }
    }
    if (option.correct) {
      this.correct = true;
      this.points += (10*(this.level+1));
      this.correctAnswer++;
      if (this.level != 2) { this.level += 1; }}
    else {
      this.inCorrectAnswer++;
      if (this.level != 0) { this.level -= 1; }}
    this.getProgressPercent();
    this.stopTimer();
    this.questionAnswered = true;
    this.countDown();
    this.writeData();
  }

  startTimer() {
    this.interval$ = interval(1000)
      .subscribe(val => {
        if (this.seconds == 0){
            this.minutes--;
        }
        this.seconds--;
        if (this.seconds < 0) {
            this.seconds = 59;
        }
        if (this.minutes == 0 && this.seconds == 0) {
            this.isQuizCompleted = true;
        }
      });
    setTimeout(() => {
      this.stopTimer();
    }, 600000);
  }

  countDown() {
      setTimeout(() => {
        this.waitNext = false;
      }, 3000);
  }

  stopTimer()  { this.interval$.unsubscribe(); }
  resetTimer() { this.stopTimer(); this.startTimer(); }
  getProgressPercent() {
      this.progress = (((this.questionNumber+1) / this.questionAmount) * 100).toString();
      return this.progress; }

  writeData() {
    this.data += "Correct: " + this.correct + ", ";
    this.data += "Points: " + this.points + "], ";
  }

  writeScore() {
    this.data += "Game [";
    this.data += "Time remaining: " + this.minutes + ":" + this.seconds + ", ";
    this.data += "Total Answered: " + this.attemptAnswer + ", ";
    this.data += "Total Correct: " + this.correctAnswer + ", ";
    this.data += "Total Incorrect: " + this.inCorrectAnswer + ", ";
    this.data += "Points: " + this.points + "], ";
  }

  download() {
      var blob = new Blob([this.data], { type: "text/plain'charset=utf-8" });
      saveAs(blob, "stats.txt");
  }

}
