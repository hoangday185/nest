import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('session')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  hash: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  session: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.session)
  user: User;
}
