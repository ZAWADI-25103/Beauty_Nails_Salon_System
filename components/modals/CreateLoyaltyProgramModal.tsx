import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';

interface Reward {
  points: number;
  reward: string;
}

interface LoyaltyRuleData {
  pointsPerSpend: number;
  appointmentsForReward: number;
  referralsForReward: number;
  rewards: Reward[];
}

// Note: This modal currently handles UI state only.
// Submitting would require an API endpoint to save these rules server-side.
// For now, it demonstrates the structure.
export function CreateLoyaltyProgramModal({ trigger }: { trigger: React.ReactNode }) {
  const [rules, setRules] = useState<LoyaltyRuleData>({
    pointsPerSpend: 1,
    appointmentsForReward: 5,
    referralsForReward: 5,
    rewards: [
      { points: 100, reward: 'Manucure gratuite' },
      { points: 250, reward: 'Extension cils gratuite' },
      { points: 500, reward: '50% sur tous services' },
      { points: 1000, reward: 'Journée beauté complète gratuite' }
    ],
  });

  const handleRewardChange = (index: number, field: keyof Reward, value: string | number) => {
    const newRewards = [...rules.rewards];
    newRewards[index] = { ...newRewards[index], [field]: value };
    setRules({ ...rules, rewards: newRewards });
  };

  const addReward = () => {
    setRules({
      ...rules,
      rewards: [...rules.rewards, { points: 0, reward: '' }]
    });
  };

  const removeReward = (index: number) => {
    if (rules.rewards.length > 1) {
      const newRewards = rules.rewards.filter((_, i) => i !== index);
      setRules({ ...rules, rewards: newRewards });
    }
  };

  const handleSubmit = () => {
    // In a real app, this would call an API endpoint to save the rules.
    console.log("Submitted Loyalty Rules:", rules);
    // Example API call: loyaltyApi.updateRules(rules);
  };

  return (
    <Dialog>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rules.rewards.length > 0 ? 'Modifier Programme' : 'Créer Programme'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pointsPerSpend">Points par 1000 CDF</Label>
              <Input
                id="pointsPerSpend"
                type="number"
                value={rules.pointsPerSpend}
                onChange={(e) => setRules({ ...rules, pointsPerSpend: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointmentsForReward">Visites pour récompense</Label>
              <Input
                id="appointmentsForReward"
                type="number"
                value={rules.appointmentsForReward}
                onChange={(e) => setRules({ ...rules, appointmentsForReward: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referralsForReward">Parrainages pour récompense</Label>
              <Input
                id="referralsForReward"
                type="number"
                value={rules.referralsForReward}
                onChange={(e) => setRules({ ...rules, referralsForReward: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Récompenses</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-lg bg-gray-50">
              {rules.rewards.map((reward, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="Points requis"
                      type="number"
                      value={reward.points}
                      onChange={(e) => handleRewardChange(index, 'points', parseInt(e.target.value) || 0)}
                      className="text-lg"
                    />
                    <Input
                      placeholder="Description récompense"
                      value={reward.reward}
                      onChange={(e) => handleRewardChange(index, 'reward', e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeReward(index)}
                    className="shrink-0"
                    disabled={rules.rewards.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={addReward} className="mt-2 w-full">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter Récompense
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" type="button">Annuler</Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
          >
            Enregistrer Programme
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}