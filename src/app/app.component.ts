import { Component, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, Subscription, interval, timer } from 'rxjs';
import { map } from 'rxjs/operators';


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
  cactoVelocidadeInicial = 7;
  cactoVelocidadeIncremento = 2;
  totalObstaculos = 5;

  frameRateAnimacao = 30;

  // A cada x segundos aumentará a dificuldade
  tempoAumentarDificuldade = 10000;

  //-------------------------------------------------------------------
  estaPulando: boolean = false;  
  dinoBottom: number = this.dinoPosicaoBottomInicial;
  
  cactosPosicao: number[] = new Array<number>(this.totalObstaculos);
  cactoVelocidade: number;  

  fimDeJogo: boolean = true;
  perdeu: boolean = false;
  
  nivel: number;
  pontos: number;
  pontuacao: number;

  click: Subscription;
  teclaPressionada: Subscription;  
  aumentadorDificuldade: Subscription;
  gerenciadorObstaculos: Subscription;

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
    if(!this.fimDeJogo) {        
      return;
    }

    this.fimDeJogo = false; 
    this.animacaoBackground = 'running';  

    this.nivel = 1;
    this.pontos = 10;
    this.pontuacao = 0;
    this.cactoVelocidade = this.cactoVelocidadeInicial;

    this.click = fromEvent(document, 'click').subscribe(() => this.pulo());
    this.teclaPressionada = fromEvent(document, 'keydown').subscribe(() => this.pulo());

    this.aumentadorDificuldade = timer(10000, this.tempoAumentarDificuldade).subscribe(() => {      
      this.nivel++;
      this.pontos += 10;
      this.cactoVelocidade += this.cactoVelocidadeIncremento; 
    });
    
    let indice = 0;
    
    const tempoAleatorio = interval(1700)
    .pipe(
      map(() => {
        return (Math.floor((Math.random() * 15)) + 1) * 100;
    }));;   

    this.gerenciadorObstaculos = tempoAleatorio.subscribe((tempo: number) => {      
      timer(tempo).subscribe(() => {        
        this.moveCacto(indice);
        indice++;
        if(indice === this.totalObstaculos - 1) {
          indice = 0;     
        }        
      })      
    });
  }


  //-------------------------------------------------------------------
  gameOver(): void {
    this.fimDeJogo = true;    
    this.perdeu = true;

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
    
    const contador = interval(this.frameRateAnimacao);
    let moveParaEsquerda = contador.subscribe(() => {
      if(this.fimDeJogo)
        return;

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
    this.aumentadorDificuldade.unsubscribe();
    this.gerenciadorObstaculos.unsubscribe();
  }
}
