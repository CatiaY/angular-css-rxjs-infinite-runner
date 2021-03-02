import { Component, OnDestroy } from '@angular/core';
import { fromEvent, Subscription, interval, of } from 'rxjs';
import { concatMap, delay, takeWhile } from 'rxjs/operators';
import { Obstaculo } from './models/obstaculo';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']  
})
export class AppComponent implements OnDestroy{
    
  //-------------------------------------------------------------------
  // CONFIGURAÇÕES
  dinoPosicaoBottomInicial: number = 70;  
  dinoPosicaoLeft: number = 40;  
  dinoWidth: number = 110;  
  puloVelocidade: number = 20;  
  puloAlturaMax: number = 250;  
  puloAlturaSafe: number = 130;

  cactoPosicaoBottomInicial: number = 70;
  cactoPosicaoLeftInicial: number = 900;
  cactoVelocidade: number = 7;  
  totalObstaculos: number = 7;
  intervaloMinimoEntreObstaculos: number = 700;

  pontos: number = 10;
  frameRateAnimacao = 30;

  //-------------------------------------------------------------------
  estaPulando: boolean = false;  
  dinoBottom: number = this.dinoPosicaoBottomInicial;
  
  cactos: Array<Obstaculo> = [];
    
  fimDeJogo: boolean = true;
  exibirMsgPerdeu: boolean = false;
    
  pontuacao: number;

  click: Subscription;
  teclaPressionada: Subscription;
  controladorObstaculos: Subscription;
    
  animacaoPlayer: string = 'animacao-parado';  
  animacaoBackground: string = 'paused';

  ngOnDestroy(): void {
    this.pararSubscriptions();
  }


  //-------------------------------------------------------------------
  iniciarJogo(): void {
    
    this.fimDeJogo = false; 
    
    this.animacaoBackground = 'running';
    this.animacaoPlayer = 'animacao-correndo';
    this.estaPulando = false;
    
    this.pontuacao = 0;
    
    if (this.cactos.length === 0) {
      for (let i = 0; i < this.totalObstaculos; i++) {
        this.cactos.push({
          left: this.cactoPosicaoLeftInicial,
          emTela: false
        });
      }
    }
    
    this.click = fromEvent(document, 'click').subscribe(() => this.pulo());
    this.teclaPressionada = fromEvent(document, 'keydown').subscribe(() => this.pulo());
   
    let indice = 0;
    this.controladorObstaculos = interval(this.frameRateAnimacao)
      .pipe(        
        concatMap(i => of(i)
          .pipe(            
            delay(this.intervaloMinimoEntreObstaculos + this.obtemNumeroAleatorio(0, 14) * 100))))
      .subscribe(() => {          
        this.cactos[indice].emTela = true;
        indice++;
        if(indice === this.totalObstaculos) {
          indice = 0;     
        }        
    });

    interval(this.frameRateAnimacao)
      .pipe(
        takeWhile(() => !this.fimDeJogo))
      .subscribe(() => {
        this.puloAnimacao();

        for(let i = 0; i < this.totalObstaculos; i++) {          
          this.moveCacto(this.cactos[i]);
        }
      });
  }


  //-------------------------------------------------------------------
  gameOver(): void {

    this.fimDeJogo = true;    
    this.exibirMsgPerdeu = true;

    this.animacaoBackground = 'paused';
    this.dinoBottom = this.dinoPosicaoBottomInicial;
    this.animacaoPlayer = 'animacao-caido';

    this.resetarPosicaoObstaculos();
    this.pararSubscriptions();
  }
  

  //-------------------------------------------------------------------
  pulo(): void {
    if(this.estaPulando)
      return;     
    
    this.estaPulando = true;  
    this.animacaoPlayer = 'animacao-pulando';
  }

  puloAnimacao(): void {
    if(!this.estaPulando)
      return;    

    // Começa a descida
    if (this.animacaoPlayer === 'animacao-descendo' || this.dinoBottom >= this.puloAlturaMax) {      
      this.animacaoPlayer = 'animacao-descendo';
      
      // Aterrissou
      if (this.dinoBottom <= this.dinoPosicaoBottomInicial) {        
        this.dinoBottom = this.dinoPosicaoBottomInicial;
        this.estaPulando = false;
        this.animacaoPlayer = 'animacao-correndo';        
      } 
      // Descendo
      else {
        this.dinoBottom -= this.puloVelocidade;            
      }

    } 
    // Subindo
    else if (this.animacaoPlayer === 'animacao-pulando') {        
      this.dinoBottom += this.puloVelocidade;        
    }    
  }


  //-------------------------------------------------------------------
  moveCacto(cacto: Obstaculo): void {    
    
    if(!cacto.emTela)
      return;
    
    // Saiu da tela
    if (cacto.left < -60) {   
      this.pontuacao += this.pontos;      
      cacto.left = this.cactoPosicaoLeftInicial;
      cacto.emTela = false;
    } 
    // Game over
    else if (cacto.left > this.dinoPosicaoLeft
            && cacto.left < (this.dinoPosicaoLeft + this.dinoWidth) - 40 
            && this.dinoBottom < this.puloAlturaSafe) {      
      this.gameOver();
    }       
    else {        
      cacto.left -= this.cactoVelocidade;        
    }
  }


  //-------------------------------------------------------------------
  resetarPosicaoObstaculos(){
    for(let i = 0; i < this.totalObstaculos; i++) {
      this.cactos[i].left = this.cactoPosicaoLeftInicial;
      this.cactos[i].emTela = false;
    }    
  }


  //-------------------------------------------------------------------
  configurarEstilosPlayer(): any {
    let estilos = {
      'bottom': `${this.dinoBottom}px`,
      'left': `${this.dinoPosicaoLeft}px`,  
      'width': `${this.dinoWidth}px`      
    };
    return estilos;
  }

  configurarEstilosObstaculo(obstaculo: Obstaculo): any {
    let estilos = {
      'bottom': `${this.cactoPosicaoBottomInicial}px`,
      'left': `${obstaculo.left}px`      
    };
    return estilos;
  }

  //-------------------------------------------------------------------
  pararSubscriptions(){
    this.click.unsubscribe();
    this.teclaPressionada.unsubscribe();    
    this.controladorObstaculos.unsubscribe();
  }

  //-------------------------------------------------------------------
  obtemNumeroAleatorio(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }
}
