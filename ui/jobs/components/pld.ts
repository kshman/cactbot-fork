import EffectId from '../../../resources/effect_id';
import TimerBar from '../../../resources/timerbar';
import TimerBox from '../../../resources/timerbox';
import { JobDetail } from '../../../types/event';
import { ResourceBox } from '../bars';
import { ComboTracker } from '../combo_tracker';
import { kAbility } from '../constants';
import { PartialFieldMatches } from '../event_emitter';
import { computeBackgroundColorFrom, showDuration } from '../utils';

import { BaseComponent, ComponentInterface } from './base';

export class PLDComponent extends BaseComponent {
  oathBox: ResourceBox;
  scornBox: TimerBox;
  expiacionBox: TimerBox;
  requiescatBox: TimerBox;
  fightOrFlightBox: TimerBox;
  tid1 = 0;
  stacksContainer: HTMLDivElement;
  requiescat: HTMLElement[] = [];
  comboTimer: TimerBar;

  constructor(o: ComponentInterface) {
    super(o);
    this.oathBox = this.bars.addResourceBox({
      classList: ['pld-color-oath'],
    });

    this.expiacionBox = this.bars.addProcBox({
      fgColor: 'pld-color-expiacion',
    });
    this.scornBox = this.bars.addProcBox({
      fgColor: 'pld-color-scorn',
    });
    this.requiescatBox = this.bars.addProcBox({
      fgColor: 'pld-color-requiescat',
    });
    this.fightOrFlightBox = this.bars.addProcBox({
      fgColor: 'pld-color-fightorflight',
    });

    this.comboTimer = this.bars.addTimerBar({
      id: 'pld-timers-combo',
      fgColor: 'combo-color',
    });

    // requiescat stack
    this.stacksContainer = document.createElement('div');
    this.stacksContainer.id = 'pld-stacks';
    this.stacksContainer.classList.add('stacks', 'hide');
    this.bars.addJobBarContainer().appendChild(this.stacksContainer);
    const requiescatContainer = document.createElement('div');
    requiescatContainer.id = 'pld-stacks-requiescat';
    this.stacksContainer.appendChild(requiescatContainer);
    for (let i = 0; i < 4; ++i) {
      const d = document.createElement('div');
      requiescatContainer.appendChild(d);
      this.requiescat.push(d);
    }

    this.reset();
  }

  override onJobDetailUpdate(jobDetail: JobDetail['PLD']): void {
    const oath = jobDetail.oath.toString();
    if (this.oathBox.innerText === oath)
      return;
    this.oathBox.innerText = oath;
    const p = this.oathBox.parentNode;
    if (jobDetail.oath < 50) {
      p.classList.add('low');
      p.classList.remove('mid');
    } else if (jobDetail.oath < 100) {
      p.classList.remove('low');
      p.classList.add('mid');
    } else {
      p.classList.remove('low');
      p.classList.remove('mid');
    }
  }

  setRequiescat(stacks: number): void {
    for (let i = 0; i < 4; ++i)
      this.requiescat[i]?.classList.toggle('active', stacks > i);
  }

  override onCombo(skill: string, combo: ComboTracker): void {
    this.comboTimer.duration = 0;
    if (combo.isFinalSkill)
      return;
    if (skill)
      this.comboTimer.duration = this.comboDuration;
  }

  override onUseAbility(skill: string): void {
    switch (skill) {
      case kAbility.Expiacion:
      case kAbility.SpiritsWithin:
        this.expiacionBox.duration = 30;
        break;
      case kAbility.CircleOfScorn:
        this.scornBox.duration = 30;
        break;
      case kAbility.Requiescat:
      case kAbility.Imperator:
        this.requiescatBox.duration = 60;
        break;
      case kAbility.FightOrFlight:
        this.tid1 = showDuration({
          tid: this.tid1,
          timerbox: this.fightOrFlightBox,
          duration: 20,
          cooldown: 60,
          threshold: this.player.gcdSkill * 2 + 1,
          activecolor: 'pld-color-fightorflight.active',
          deactivecolor: 'pld-color-fightorflight',
        });
        break;
    }
  }

  override onYouGainEffect(id: string, matches: PartialFieldMatches<'GainsEffect'>): void {
    if (id === EffectId.Requiescat_558) {
      this.stacksContainer.classList.remove('hide');
      this.setRequiescat(parseInt(matches.count ?? '0'));
    }
  }

  override onYouLoseEffect(id: string): void {
    if (id === EffectId.Requiescat_558) {
      this.setRequiescat(0);
      this.stacksContainer.classList.add('hide');
    }
  }

  override onStatChange({ gcdSkill }: { gcdSkill: number }): void {
    this.scornBox.threshold = gcdSkill + 1;
    this.expiacionBox.threshold = gcdSkill + 1;
    this.requiescatBox.threshold = gcdSkill + 1;
    this.fightOrFlightBox.threshold = gcdSkill * 2 + 1;
  }

  override reset(): void {
    this.scornBox.duration = 0;
    this.expiacionBox.duration = 0;
    this.requiescatBox.duration = 0;
    this.fightOrFlightBox.duration = 0;
    this.fightOrFlightBox.threshold = this.player.gcdSkill * 2 + 1;
    this.fightOrFlightBox.fg = computeBackgroundColorFrom(
      this.fightOrFlightBox,
      'pld-color-fightorflight',
    );
    window.clearTimeout(this.tid1);
    this.setRequiescat(0);
    this.stacksContainer.classList.add('hide');
  }
}
