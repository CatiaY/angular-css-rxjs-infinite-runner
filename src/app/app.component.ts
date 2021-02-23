import { Component, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, Subscription, interval, timer, asyncScheduler, range, of } from 'rxjs';
import { concatMap, debounceTime, delay, map, takeWhile, tap, throttleTime } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']  
})
export class AppComponent implements OnInit, OnDestroy{
    
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
  intervaloMinimoEntreObstaculos: number = 600;

  pontos: number = 10;
  frameRateAnimacao = 30;

  //-------------------------------------------------------------------
  estaPulando: boolean = false;  
  dinoBottom: number = this.dinoPosicaoBottomInicial;
  
  cactosPosicao: number[] = new Array<number>(this.totalObstaculos);
    
  fimDeJogo: boolean = true;
  exibirMsgPerdeu: boolean = false;
    
  pontuacao: number;

  click: Subscription;
  teclaPressionada: Subscription;  
    
  animacaoPlayer: string = 'animacao-parado';  
  animacaoBackground: string = 'paused';

  ngOnInit(): void {
    this.resetarPosicaoObstaculos();
  }

  ngOnDestroy(): void {
    this.pararSubscriptions();
  }


  //-------------------------------------------------------------------
  iniciarJogo(): void {
    
    this.fimDeJogo = false; 
    
    this.animacaoBackground = 'running';  
    
    this.pontuacao = 0;
    
    this.resetarPosicaoObstaculos();
    
    this.click = fromEvent(document, 'click').subscribe(() => this.pulo());
    this.teclaPressionada = fromEvent(document, 'keydown').subscribe(() => this.pulo());
   
    let indice = 0;

    interval(this.frameRateAnimacao)
      .pipe(
        takeWhile(() => !this.fimDeJogo),
        concatMap(i => of(i)
          .pipe(delay(this.intervaloMinimoEntreObstaculos + this.obtemNumeroAleatorio(0, 14) * 100))))
      .subscribe(() => { 
        this.moveCacto(indice);
        indice++;
        if(indice === this.totalObstaculos) {
          indice = 0;     
        }          
    });
  }


  //-------------------------------------------------------------------
  gameOver(): void {

    this.fimDeJogo = true;    
    this.exibirMsgPerdeu = true;

    this.animacaoBackground = 'paused';
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

    const contador = interval(this.frameRateAnimacao);
    let puloSubida = contador.subscribe(() => {
      // Começa a descida
      if (this.dinoBottom >= this.puloAlturaMax) {
        puloSubida.unsubscribe();
        this.animacaoPlayer = 'animacao-descendo';

        let puloDescida = contador.subscribe(() => {
          // Aterrissou
          if (this.dinoBottom <= this.dinoPosicaoBottomInicial) {
            puloDescida.unsubscribe();
            this.dinoBottom = this.dinoPosicaoBottomInicial;
            this.estaPulando = false;
            if(this.fimDeJogo){
              this.animacaoPlayer = 'animacao-caido';
            }
            else {
              this.animacaoPlayer = 'animacao-correndo';
            }
          } 
          // Descendo
          else {
            this.dinoBottom -= this.puloVelocidade;            
          }
        });
      } 
      // Subindo
      else {        
        this.dinoBottom += this.puloVelocidade;        
      }
    });
  }


  //-------------------------------------------------------------------
  moveCacto(index: number): void {    
        
    let moveParaEsquerda = interval(this.frameRateAnimacao)
      .pipe(takeWhile(() => !this.fimDeJogo))
      .subscribe(() => {
        // Saiu da tela
        if (this.cactosPosicao[index] < -60) {   
          this.pontuacao += this.pontos;
          moveParaEsquerda.unsubscribe();

          // Reseta posição
          this.cactosPosicao[index] = this.cactoPosicaoLeftInicial;
        } 
        // Game over
        else if (this.cactosPosicao[index] > this.dinoPosicaoLeft
                && this.cactosPosicao[index] < (this.dinoPosicaoLeft + this.dinoWidth) - 40 
                && this.dinoBottom < this.puloAlturaSafe) {        
          moveParaEsquerda.unsubscribe();
          this.gameOver();
        }       
        else {        
          this.cactosPosicao[index] -= this.cactoVelocidade;        
        }
    });
  }  


  //-------------------------------------------------------------------
  resetarPosicaoObstaculos(){
    for(let i = 0; i < this.totalObstaculos; i++) {
      this.cactosPosicao[i] = this.cactoPosicaoLeftInicial;
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

  //-------------------------------------------------------------------
  pararSubscriptions(){
    this.click.unsubscribe();
    this.teclaPressionada.unsubscribe();    
  }

  //-------------------------------------------------------------------
  obtemNumeroAleatorio(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }
}
