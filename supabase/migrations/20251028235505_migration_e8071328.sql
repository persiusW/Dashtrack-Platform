-- Add missing foreign key constraints to clicks table
ALTER TABLE clicks
  ADD CONSTRAINT clicks_organization_id_fkey 
    FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) 
    ON DELETE CASCADE;

ALTER TABLE clicks
  ADD CONSTRAINT clicks_activation_id_fkey 
    FOREIGN KEY (activation_id) 
    REFERENCES activations(id) 
    ON DELETE CASCADE;

ALTER TABLE clicks
  ADD CONSTRAINT clicks_zone_id_fkey 
    FOREIGN KEY (zone_id) 
    REFERENCES zones(id) 
    ON DELETE SET NULL;

ALTER TABLE clicks
  ADD CONSTRAINT clicks_agent_id_fkey 
    FOREIGN KEY (agent_id) 
    REFERENCES agents(id) 
    ON DELETE SET NULL;