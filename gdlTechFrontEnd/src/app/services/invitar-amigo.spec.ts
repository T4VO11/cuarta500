import { TestBed } from '@angular/core/testing';

import { InvitarAmigo } from './invitar-amigo';

describe('InvitarAmigo', () => {
  let service: InvitarAmigo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InvitarAmigo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
